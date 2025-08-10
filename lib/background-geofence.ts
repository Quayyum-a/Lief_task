import { LocationCoordinates, PerimeterSettings } from "./location";
import { perimeterManager } from "./perimeter";
import { notificationService } from "./notifications";

export interface RegionMonitoringEvent {
  id: string;
  type: "enter" | "exit";
  timestamp: number;
  location: LocationCoordinates;
  perimeterId?: string;
  perimeter?: PerimeterSettings;
}

export interface BackgroundFetchResult {
  success: boolean;
  timestamp: number;
  location: LocationCoordinates;
  isInPerimeter: boolean;
  events: RegionMonitoringEvent[];
  error?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  type: "clock_in" | "clock_out";
  timestamp: string;
  locationLat: number;
  locationLon: number;
  accuracy?: number;
  isValidLocation: boolean;
  perimeterId?: string;
  note?: string;
  backgroundTriggered?: boolean;
}

class BackgroundGeofenceService {
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastLocation: LocationCoordinates | null = null;
  private lastPerimeterState: boolean | null = null;
  private events: RegionMonitoringEvent[] = [];
  private timeEntries: TimeEntry[] = [];

  /**
   * Start background region monitoring
   */
  async startRegionMonitoring(
    options: {
      interval?: number; // milliseconds
      enableBackgroundFetch?: boolean;
    } = {}
  ): Promise<boolean> {
    const { interval = 30000, enableBackgroundFetch = true } = options;

    if (this.isMonitoring) {
      console.log("🎯 Region monitoring already active");
      return true;
    }

    try {
      this.isMonitoring = true;
      console.log("🎯 Starting background region monitoring...");

      // Simulate background fetch registration
      if (enableBackgroundFetch) {
        await this.registerBackgroundFetch();
      }

      // Start periodic monitoring
      this.monitoringInterval = setInterval(() => {
        this.performBackgroundLocationCheck();
      }, interval);

      console.log(
        `✅ Background region monitoring started (interval: ${interval}ms)`
      );
      return true;
    } catch (error) {
      console.error("❌ Failed to start region monitoring:", error);
      this.isMonitoring = false;
      return false;
    }
  }

  /**
   * Stop background region monitoring
   */
  stopRegionMonitoring(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log("⏹️ Background region monitoring stopped");
  }

  /**
   * Simulate background fetch registration (PWA/Service Worker)
   */
  private async registerBackgroundFetch(): Promise<void> {
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      try {
        await navigator.serviceWorker.ready;
        console.log("📱 Background fetch capability detected");

        // In a real implementation, this would register for background sync
        // registration.sync.register('background-geofence-check')

        return Promise.resolve();
      } catch (error) {
        console.warn("⚠️ Background fetch registration failed:", error);
      }
    } else {
      console.log(
        "📱 Background fetch not supported, using foreground monitoring"
      );
    }
  }

  /**
   * Perform background location check (simulated)
   */
  private async performBackgroundLocationCheck(): Promise<BackgroundFetchResult> {
    const timestamp = Date.now();
    let location: LocationCoordinates;
    let success = false;
    let error: string | undefined;

    try {
      // In real implementation, this would get the actual location
      // For simulation, we'll use the last known location or simulate one
      if (this.lastLocation) {
        // Simulate small GPS drift
        location = {
          latitude: this.lastLocation.latitude + (Math.random() - 0.5) * 0.0001,
          longitude:
            this.lastLocation.longitude + (Math.random() - 0.5) * 0.0001,
          accuracy: 15 + Math.random() * 10, // 15-25m accuracy
          timestamp,
        };
      } else {
        // Use default location (Times Square)
        location = {
          latitude: 40.7831,
          longitude: -73.9712,
          accuracy: 20,
          timestamp,
        };
      }

      success = true;
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown location error";
      location = { latitude: 0, longitude: 0, accuracy: 999, timestamp };
    }

    // Check perimeter status
    const result = perimeterManager.checkLocation(location);
    const isInPerimeter = result.isWithin;

    // Detect region entry/exit events
    const events = this.detectRegionEvents(location, isInPerimeter);

    // Log background activity
    console.log(
      `🔄 Background location check: ${success ? "✅" : "❌"} ${result.message}`
    );

    const fetchResult: BackgroundFetchResult = {
      success,
      timestamp,
      location,
      isInPerimeter,
      events,
      error,
    };

    // Process events
    await this.processRegionEvents(events, location);

    // Update state
    this.lastLocation = location;
    this.lastPerimeterState = isInPerimeter;

    return fetchResult;
  }

  /**
   * Detect region entry/exit events
   */
  private detectRegionEvents(
    location: LocationCoordinates,
    isInPerimeter: boolean
  ): RegionMonitoringEvent[] {
    const events: RegionMonitoringEvent[] = [];

    // Check if perimeter state changed
    if (
      this.lastPerimeterState !== null &&
      this.lastPerimeterState !== isInPerimeter
    ) {
      const eventType = isInPerimeter ? "enter" : "exit";
      const perimeter =
        perimeterManager.getClosestPerimeter(location).perimeter;

      const event: RegionMonitoringEvent = {
        id: `region_${eventType}_${Date.now()}`,
        type: eventType,
        timestamp: Date.now(),
        location,
        perimeterId: perimeter ? "closest_perimeter" : undefined,
        perimeter: perimeter || undefined,
      };

      events.push(event);
      this.events.push(event);

      console.log(`🚨 Region ${eventType} event detected:`, {
        type: eventType,
        location: `${location.latitude.toFixed(
          6
        )}, ${location.longitude.toFixed(6)}`,
        perimeter: perimeter ? `${perimeter.radiusInMeters}m radius` : "none",
      });
    }

    return events;
  }

  /**
   * Process region monitoring events
   */
  private async processRegionEvents(
    events: RegionMonitoringEvent[],
    location: LocationCoordinates
  ): Promise<void> {
    for (const event of events) {
      try {
        // Send notifications
        if (event.type === "enter") {
          notificationService.sendClockInReminder(
            location,
            event.perimeter?.name
          );
        } else if (event.type === "exit") {
          notificationService.sendClockOutReminder(
            location,
            event.perimeter?.name
          );
        }

        // In a real app, this would trigger Prisma writes
        await this.simulatePrismaWrite(event, location);
      } catch (error) {
        console.error("❌ Failed to process region event:", error);
      }
    }
  }

  /**
   * Simulate Prisma database writes for TimeEntry records
   */
  private async simulatePrismaWrite(
    event: RegionMonitoringEvent,
    location: LocationCoordinates
  ): Promise<void> {
    // Simulate database write delay
    await new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200)
    );

    const timeEntry: TimeEntry = {
      id: `time_entry_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      userId: "simulated_user", // In real app, this would be the current user ID
      type: event.type === "enter" ? "clock_in" : "clock_out",
      timestamp: new Date(event.timestamp).toISOString(),
      locationLat: location.latitude,
      locationLon: location.longitude,
      accuracy: location.accuracy,
      isValidLocation: event.type === "enter", // Clock in requires valid location
      perimeterId: event.perimeterId,
      backgroundTriggered: true, // Flag to indicate this was triggered by background monitoring
      note: `Background ${event.type} event at ${new Date(
        event.timestamp
      ).toLocaleTimeString()}`,
    };

    // Store in memory (simulating database)
    this.timeEntries.push(timeEntry);

    console.log(`💾 Simulated Prisma write:`, {
      id: timeEntry.id,
      type: timeEntry.type,
      location: `${timeEntry.locationLat.toFixed(
        6
      )}, ${timeEntry.locationLon.toFixed(6)}`,
      valid: timeEntry.isValidLocation,
    });
  }

  /**
   * Force a background check (for testing)
   */
  async triggerBackgroundCheck(): Promise<BackgroundFetchResult> {
    console.log("🧪 Manually triggering background check...");
    return await this.performBackgroundLocationCheck();
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    lastCheck: number | null;
    eventsCount: number;
    timeEntriesCount: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      lastCheck: this.lastLocation?.timestamp || null,
      eventsCount: this.events.length,
      timeEntriesCount: this.timeEntries.length,
    };
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 10): RegionMonitoringEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get simulated time entries
   */
  getTimeEntries(limit: number = 20): TimeEntry[] {
    return this.timeEntries.slice(-limit);
  }

  /**
   * Clear all stored data
   */
  clearData(): void {
    this.events = [];
    this.timeEntries = [];
    this.lastLocation = null;
    this.lastPerimeterState = null;
    console.log("🧹 Background geofence data cleared");
  }

  /**
   * Simulate location update from external source
   */
  async simulateLocationUpdate(location: LocationCoordinates): Promise<void> {
    console.log("📍 Simulated location update received:", {
      lat: location.latitude.toFixed(6),
      lng: location.longitude.toFixed(6),
      accuracy: location.accuracy,
    });

    const result = perimeterManager.checkLocation(location);
    const isInPerimeter = result.isWithin;

    // Process as background check
    const events = this.detectRegionEvents(location, isInPerimeter);
    await this.processRegionEvents(events, location);

    // Update state
    this.lastLocation = location;
    this.lastPerimeterState = isInPerimeter;
  }
}

// Export singleton
export const backgroundGeofenceService = new BackgroundGeofenceService();

// Development utilities
export const backgroundUtils = {
  /**
   * Start monitoring with test configuration
   */
  async startTestMonitoring(): Promise<boolean> {
    return await backgroundGeofenceService.startRegionMonitoring({
      interval: 10000, // 10 seconds for testing
      enableBackgroundFetch: true,
    });
  },

  /**
   * Run a complete test scenario
   */
  async runTestScenario(): Promise<void> {
    console.log("🧪 Starting background geofence test scenario...");

    // Start monitoring
    await backgroundGeofenceService.startRegionMonitoring({ interval: 5000 });

    // Simulate location sequence
    const testLocations = [
      { latitude: 40.78, longitude: -73.97, accuracy: 15 }, // Outside
      { latitude: 40.7825, longitude: -73.9708, accuracy: 12 }, // Approaching
      { latitude: 40.7831, longitude: -73.9712, accuracy: 8 }, // Inside center
      { latitude: 40.784, longitude: -73.972, accuracy: 18 }, // Outside again
    ];

    for (let i = 0; i < testLocations.length; i++) {
      setTimeout(async () => {
        await backgroundGeofenceService.simulateLocationUpdate({
          ...testLocations[i],
          timestamp: Date.now(),
        });
      }, i * 3000); // 3 seconds between updates
    }

    // Stop after test
    setTimeout(() => {
      backgroundGeofenceService.stopRegionMonitoring();
      console.log("🧪 Test scenario completed");
    }, testLocations.length * 3000 + 2000);
  },

  /**
   * Log current status
   */
  logStatus(): void {
    const status = backgroundGeofenceService.getStatus();
    const events = backgroundGeofenceService.getRecentEvents();
    const entries = backgroundGeofenceService.getTimeEntries();

    console.log("📊 Background Geofence Status:", {
      monitoring: status.isMonitoring,
      lastCheck: status.lastCheck
        ? new Date(status.lastCheck).toLocaleTimeString()
        : "never",
      events: status.eventsCount,
      timeEntries: status.timeEntriesCount,
    });

    console.log(
      "📋 Recent Events:",
      events.map((e) => ({
        type: e.type,
        time: new Date(e.timestamp).toLocaleTimeString(),
        location: `${e.location.latitude.toFixed(
          4
        )}, ${e.location.longitude.toFixed(4)}`,
      }))
    );

    console.log(
      "📝 Recent Time Entries:",
      entries.slice(-3).map((t) => ({
        type: t.type,
        time: new Date(t.timestamp).toLocaleTimeString(),
        location: `${t.locationLat.toFixed(4)}, ${t.locationLon.toFixed(4)}`,
        valid: t.isValidLocation,
      }))
    );
  },
};
