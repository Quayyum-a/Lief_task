interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface PerimeterSettings {
  centerLatitude: number;
  centerLongitude: number;
  radiusInMeters: number;
  name?: string;
}

interface LocationError {
  code: number;
  message: string;
  type:
    | "PERMISSION_DENIED"
    | "POSITION_UNAVAILABLE"
    | "TIMEOUT"
    | "NOT_SUPPORTED";
}

interface LocationWatchOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

class LocationService {
  private watchId: number | null = null;
  private lastKnownPosition: LocationCoordinates | null = null;
  private onLocationChange: ((location: LocationCoordinates) => void) | null =
    null;
  private onLocationError: ((error: LocationError) => void) | null = null;

  /**
   * Check if geolocation is supported by the browser
   */
  isSupported(): boolean {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    return "geolocation" in navigator;
  }

  /**
   * Request location permission and get current position
   */
  async getCurrentPosition(
    options?: PositionOptions
  ): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(
          this.createError(
            "NOT_SUPPORTED",
            "Geolocation is not supported by this browser"
          )
        );
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute
        ...options,
      };

      if (typeof window === "undefined" || typeof navigator === "undefined") {
        reject(
          this.createError("NOT_SUPPORTED", "Geolocation is not supported")
        );
        return;
      }
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
   * Start watching location changes
   */
  startWatching(
    onLocationChange: (location: LocationCoordinates) => void,
    onError?: (error: LocationError) => void,
    options?: LocationWatchOptions
  ): boolean {
    if (!this.isSupported()) {
      onError?.(
        this.createError("NOT_SUPPORTED", "Geolocation is not supported")
      );
      return false;
    }

    if (this.watchId !== null) {
      this.stopWatching();
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000, // 30 seconds
      ...options,
    };

    this.onLocationChange = onLocationChange;
    this.onLocationError = onError || null;

    if (typeof window === "undefined" || typeof navigator === "undefined") {
      onError?.(
        this.createError("NOT_SUPPORTED", "Geolocation is not supported")
      );
      return false;
    }
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
  stopWatching(): void {
    if (this.watchId !== null) {
      if (typeof window !== "undefined" && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(this.watchId);
      }
      this.watchId = null;
    }
    this.onLocationChange = null;
    this.onLocationError = null;
  }

  /**
   * Get the last known position
   */
  getLastKnownPosition(): LocationCoordinates | null {
    return this.lastKnownPosition;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  calculateDistance(
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
  isWithinPerimeter(
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
   * Request permission explicitly (useful for PWAs)
   */
  async requestPermission(): Promise<"granted" | "denied" | "prompt"> {
    if (!this.isSupported()) {
      throw this.createError("NOT_SUPPORTED", "Geolocation is not supported");
    }

    // Check cached permission state to avoid repeated prompts
    const cachedPermission = localStorage.getItem(
      "geolocation_permission_state"
    );
    const cacheTime = localStorage.getItem("geolocation_permission_time");

    // Use cached state if less than 5 minutes old
    if (cachedPermission && cacheTime) {
      const timeDiff = Date.now() - parseInt(cacheTime);
      if (timeDiff < 5 * 60 * 1000) {
        // 5 minutes
        return cachedPermission as "granted" | "denied" | "prompt";
      }
    }

    let permissionState: "granted" | "denied" | "prompt";

    // For modern browsers that support permissions API
    if (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      "permissions" in navigator
    ) {
      try {
        const permission = await navigator.permissions.query({
          name: "geolocation",
        });
        permissionState = permission.state;
      } catch {
        // Fallback to testing with getCurrentPosition
        permissionState = await this.testPermissionWithGetCurrentPosition();
      }
    } else {
      // Fallback for older browsers
      permissionState = await this.testPermissionWithGetCurrentPosition();
    }

    // Cache the result
    localStorage.setItem("geolocation_permission_state", permissionState);
    localStorage.setItem("geolocation_permission_time", Date.now().toString());

    return permissionState;
  }

  /**
   * Test permission by attempting to get current position
   */
  private async testPermissionWithGetCurrentPosition(): Promise<
    "granted" | "denied" | "prompt"
  > {
    try {
      await this.getCurrentPosition({ timeout: 5000, maximumAge: Infinity });
      return "granted";
    } catch (error) {
      const locationError = error as LocationError;
      if (locationError.type === "PERMISSION_DENIED") {
        return "denied";
      }
      return "prompt";
    }
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
   * Format location for display
   */
  formatLocation(location: LocationCoordinates): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  /**
   * Get location accuracy description
   */
  getAccuracyDescription(accuracy?: number): string {
    if (!accuracy) return "Unknown accuracy";

    if (accuracy <= 5) return "Very high accuracy";
    if (accuracy <= 20) return "High accuracy";
    if (accuracy <= 100) return "Medium accuracy";
    return "Low accuracy";
  }
}

// Export singleton instance
export const locationService = new LocationService();

// Export types
export type {
  LocationCoordinates,
  PerimeterSettings,
  LocationError,
  LocationWatchOptions,
};
