import {
  LocationCoordinates,
  LocationError,
  PerimeterSettings,
} from "./location";

interface LocationPermissionState {
  status: "granted" | "denied" | "undetermined" | "unknown";
  lastChecked: number;
  attempts: number;
}

interface LocationServiceOptions {
  cacheTimeout?: number; // milliseconds
  maxRetryAttempts?: number;
  backoffMultiplier?: number;
}

/**
 * Enhanced LocationService with proper permission state management
 * and prevention of repeated permission requests
 */
export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private lastKnownPosition: LocationCoordinates | null = null;
  private onLocationChange: ((location: LocationCoordinates) => void) | null =
    null;
  private onLocationError: ((error: LocationError) => void) | null = null;
  private permissionCache: LocationPermissionState | null = null;
  private readonly options: Required<LocationServiceOptions>;

  private constructor(options: LocationServiceOptions = {}) {
    this.options = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxRetryAttempts: 3,
      backoffMultiplier: 2000, // 2 seconds base
      ...options,
    };

    // Load cached permission state
    this.loadPermissionCache();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(options?: LocationServiceOptions): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService(options);
    }
    return LocationService.instance;
  }

  /**
   * Main method to ensure location access - only requests when necessary
   */
  public async ensureLocationAccess(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        throw this.createError(
          "NOT_SUPPORTED",
          "Geolocation is not supported by this browser"
        );
      }

      const currentPermissionState = await this.checkCurrentPermissionState();

      // Only request permission if it's undetermined
      if (currentPermissionState === "undetermined") {
        const newState = await this.requestPermissionSafely();
        return newState === "granted";
      }

      return currentPermissionState === "granted";
    } catch (error) {
      console.error(
        "LocationService: Failed to ensure location access:",
        error
      );
      return false;
    }
  }

  /**
   * Check current permission state without triggering a request
   */
  private async checkCurrentPermissionState(): Promise<
    "granted" | "denied" | "undetermined"
  > {
    // Check cache first
    if (this.permissionCache && this.isCacheValid()) {
      return this.permissionCache.status === "unknown"
        ? "undetermined"
        : this.permissionCache.status;
    }

    let permissionState: "granted" | "denied" | "undetermined";

    // Use Permissions API if available
    if ("permissions" in navigator && "query" in navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation" as PermissionName,
        });

        switch (permission.state) {
          case "granted":
            permissionState = "granted";
            break;
          case "denied":
            permissionState = "denied";
            break;
          case "prompt":
          default:
            permissionState = "undetermined";
            break;
        }
      } catch (error) {
        console.warn(
          "LocationService: Permissions API query failed, using fallback"
        );
        permissionState = "undetermined";
      }
    } else {
      // Fallback: assume undetermined for older browsers
      permissionState = "undetermined";
    }

    // Update cache
    this.updatePermissionCache(permissionState);
    return permissionState;
  }

  /**
   * Safely request permission with rate limiting and backoff
   */
  private async requestPermissionSafely(): Promise<
    "granted" | "denied" | "undetermined"
  > {
    const cache = this.permissionCache;

    // Rate limiting: don't allow too many attempts
    if (cache && cache.attempts >= this.options.maxRetryAttempts) {
      const timeSinceLastAttempt = Date.now() - cache.lastChecked;
      const backoffTime =
        this.options.backoffMultiplier * Math.pow(2, cache.attempts - 1);

      if (timeSinceLastAttempt < backoffTime) {
        console.warn(
          `LocationService: Rate limited. Next attempt allowed in ${Math.ceil(
            (backoffTime - timeSinceLastAttempt) / 1000
          )}s`
        );
        return cache.status === "unknown" ? "undetermined" : cache.status;
      }
    }

    try {
      // Test permission by attempting to get current position with short timeout
      const position = await this.getCurrentPositionWithTimeout(1000);
      this.updatePermissionCache("granted", true);
      return "granted";
    } catch (error) {
      const locationError = error as LocationError;

      if (locationError.type === "PERMISSION_DENIED") {
        this.updatePermissionCache("denied", true);
        return "denied";
      }

      // For other errors (timeout, unavailable), don't update cache
      console.warn(
        "LocationService: Position request failed but permission unclear:",
        locationError.message
      );
      return "undetermined";
    }
  }

  /**
   * Get current position with a specific timeout
   */
  private async getCurrentPositionWithTimeout(
    timeout: number
  ): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          this.lastKnownPosition = location;
          resolve(location);
        },
        (error) => {
          reject(this.mapGeolocationError(error));
        },
        {
          enableHighAccuracy: false,
          timeout,
          maximumAge: 60000,
        }
      );
    });
  }

  /**
   * Get current position (enhanced version)
   */
  public async getCurrentPosition(
    options?: PositionOptions
  ): Promise<LocationCoordinates> {
    const hasAccess = await this.ensureLocationAccess();
    if (!hasAccess) {
      throw this.createError(
        "PERMISSION_DENIED",
        "Location access not available"
      );
    }

    return new Promise((resolve, reject) => {
      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          this.lastKnownPosition = location;
          resolve(location);
        },
        (error) => {
          reject(this.mapGeolocationError(error));
        },
        defaultOptions
      );
    });
  }

  /**
   * Start watching location with proper permission checking
   */
  public async startWatching(
    onLocationChange: (location: LocationCoordinates) => void,
    onError?: (error: LocationError) => void,
    options?: PositionOptions
  ): Promise<boolean> {
    const hasAccess = await this.ensureLocationAccess();
    if (!hasAccess) {
      onError?.(
        this.createError("PERMISSION_DENIED", "Location access not available")
      );
      return false;
    }

    if (this.watchId !== null) {
      this.stopWatching();
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
      ...options,
    };

    this.onLocationChange = onLocationChange;
    this.onLocationError = onError || null;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        this.lastKnownPosition = location;
        this.onLocationChange?.(location);
      },
      (error) => {
        const locationError = this.mapGeolocationError(error);
        this.onLocationError?.(locationError);
      },
      defaultOptions
    );

    return true;
  }

  /**
   * Stop watching location changes
   */
  public stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.onLocationChange = null;
    this.onLocationError = null;
  }

  /**
   * Check if geolocation is supported
   */
  public isSupported(): boolean {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    return "geolocation" in navigator;
  }

  /**
   * Get last known position
   */
  public getLastKnownPosition(): LocationCoordinates | null {
    return this.lastKnownPosition;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  public calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (point1.latitude * Math.PI) / 180;
    const lat2Rad = (point2.latitude * Math.PI) / 180;
    const deltaLatRad = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const deltaLngRad = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLngRad / 2) *
        Math.sin(deltaLngRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if a location is within a perimeter
   */
  public isWithinPerimeter(
    currentLocation: LocationCoordinates,
    perimeter: PerimeterSettings
  ): boolean {
    const distance = this.calculateDistance(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
      {
        latitude: perimeter.centerLatitude,
        longitude: perimeter.centerLongitude,
      }
    );

    return distance <= perimeter.radiusInMeters;
  }

  /**
   * Permission cache management
   */
  private loadPermissionCache(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const cached = localStorage.getItem("location_permission_cache");
        if (cached) {
          this.permissionCache = JSON.parse(cached);
        }
      } catch (error) {
        console.warn(
          "LocationService: Failed to load permission cache:",
          error
        );
        this.permissionCache = null;
      }
    } else {
      this.permissionCache = null;
    }
  }

  private savePermissionCache(): void {
    if (
      this.permissionCache &&
      typeof window !== "undefined" &&
      window.localStorage
    ) {
      try {
        localStorage.setItem(
          "location_permission_cache",
          JSON.stringify(this.permissionCache)
        );
      } catch (error) {
        console.warn(
          "LocationService: Failed to save permission cache:",
          error
        );
      }
    }
  }

  private updatePermissionCache(
    status: "granted" | "denied" | "undetermined",
    incrementAttempt: boolean = false
  ): void {
    const now = Date.now();

    if (this.permissionCache) {
      this.permissionCache.status = status;
      this.permissionCache.lastChecked = now;
      if (incrementAttempt) {
        this.permissionCache.attempts += 1;
      }
      // Reset attempts counter on successful grant
      if (status === "granted") {
        this.permissionCache.attempts = 0;
      }
    } else {
      this.permissionCache = {
        status,
        lastChecked: now,
        attempts: incrementAttempt ? 1 : 0,
      };
    }

    this.savePermissionCache();
  }

  private isCacheValid(): boolean {
    if (!this.permissionCache) return false;

    const age = Date.now() - this.permissionCache.lastChecked;
    return age < this.options.cacheTimeout;
  }

  /**
   * Map GeolocationPositionError to our LocationError interface
   */
  private mapGeolocationError(error: GeolocationPositionError): LocationError {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return this.createError(
          "PERMISSION_DENIED",
          "Location access was denied by the user"
        );
      case error.POSITION_UNAVAILABLE:
        return this.createError(
          "POSITION_UNAVAILABLE",
          "Location information is unavailable"
        );
      case error.TIMEOUT:
        return this.createError(
          "TIMEOUT",
          "The request to get user location timed out"
        );
      default:
        return this.createError(
          "POSITION_UNAVAILABLE",
          error.message || "Unknown location error"
        );
    }
  }

  /**
   * Create a standardized location error
   */
  private createError(
    type: LocationError["type"],
    message: string
  ): LocationError {
    const code = {
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
      NOT_SUPPORTED: 4,
    }[type];

    return {
      code,
      message,
      type,
    };
  }

  /**
   * Clear all cached data (useful for testing or reset)
   */
  public clearCache(): void {
    this.permissionCache = null;
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("location_permission_cache");
    }
  }

  /**
   * Get current permission status (for debugging)
   */
  public getPermissionStatus(): LocationPermissionState | null {
    return this.permissionCache;
  }
}

// Export singleton instance
export const enhancedLocationService = LocationService.getInstance();
