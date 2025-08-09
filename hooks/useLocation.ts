'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { locationService, LocationCoordinates, LocationError, PerimeterSettings } from '@/lib/location'
import { enhancedLocationService } from '@/lib/LocationService'

interface UseLocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean
}

interface UseLocationReturn {
  location: LocationCoordinates | null
  error: LocationError | null
  loading: boolean
  permissionState: 'granted' | 'denied' | 'prompt' | 'unknown'
  isSupported: boolean
  requestLocation: () => Promise<void>
  requestPermission: () => Promise<void>
  startWatching: () => Promise<void>
  stopWatching: () => void
  isWatching: boolean
  isWithinPerimeter: (perimeter: PerimeterSettings) => boolean
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoordinates | null>(null)
  const [error, setError] = useState<LocationError | null>(null)
  const [loading, setLoading] = useState(false)
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [isWatching, setIsWatching] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const watchStartedRef = useRef(false)

  // Check support only on client side
  useEffect(() => {
    setIsSupported(locationService.isSupported())
  }, [])

  // Check permission state on mount (only once) - Fixed to prevent loops
  useEffect(() => {
    if (isSupported && permissionState === 'unknown') {
      // Use enhanced location service to check without requesting
      enhancedLocationService.ensureLocationAccess().then((hasAccess) => {
        setPermissionState(hasAccess ? 'granted' : 'denied')
      }).catch(() => {
        setPermissionState('unknown')
      })
    }
  }, [isSupported]) // Only depend on isSupported to prevent loops

  // Auto-start watching if watch option is true and permission is granted
  useEffect(() => {
    if (options.watch && permissionState === 'granted' && !watchStartedRef.current) {
      startWatching()
      watchStartedRef.current = true
    }
  }, [options.watch, permissionState])

  const requestLocation = useCallback(async () => {
    if (!isSupported) {
      setError({
        code: 4,
        message: 'Geolocation is not supported by this browser',
        type: 'NOT_SUPPORTED'
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const position = await enhancedLocationService.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: options.timeout,
        maximumAge: options.maximumAge
      })
      setLocation(position)
      setPermissionState('granted')
    } catch (err) {
      const locationError = err as LocationError
      setError(locationError)
      if (locationError.type === 'PERMISSION_DENIED') {
        setPermissionState('denied')
      }
    } finally {
      setLoading(false)
    }
  }, [isSupported, options.enableHighAccuracy, options.timeout, options.maximumAge])

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError({
        code: 4,
        message: 'Geolocation is not supported by this browser',
        type: 'NOT_SUPPORTED'
      })
      return
    }

    // Only request if permission state is not already granted or denied
    if (permissionState === 'granted' || permissionState === 'denied') {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const hasAccess = await enhancedLocationService.ensureLocationAccess()
      const newState = hasAccess ? 'granted' : 'denied'
      setPermissionState(newState)
      
      if (hasAccess) {
        // Automatically get current position when permission is granted
        await requestLocation()
      }
    } catch (err) {
      const locationError = err as LocationError
      setError(locationError)
      if (locationError.type === 'PERMISSION_DENIED') {
        setPermissionState('denied')
      }
    } finally {
      setLoading(false)
    }
  }, [isSupported, permissionState, requestLocation])

  const startWatching = useCallback(async () => {
    if (!isSupported || isWatching) return

    // Use enhanced service to safely start watching
    const success = await enhancedLocationService.startWatching(
      (newLocation) => {
        setLocation(newLocation)
        setError(null)
        setPermissionState('granted')
      },
      (watchError) => {
        setError(watchError)
        if (watchError.type === 'PERMISSION_DENIED') {
          setPermissionState('denied')
        }
      },
      {
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: options.timeout,
        maximumAge: options.maximumAge
      }
    )

    if (success) {
      setIsWatching(true)
    } else {
      setPermissionState('denied')
    }
  }, [isSupported, isWatching, options.enableHighAccuracy, options.timeout, options.maximumAge])

  const stopWatching = useCallback(() => {
    enhancedLocationService.stopWatching()
    setIsWatching(false)
  }, [])

  const isWithinPerimeter = useCallback((perimeter: PerimeterSettings): boolean => {
    if (!location) return false
    return enhancedLocationService.isWithinPerimeter(location, perimeter)
  }, [location])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isWatching) {
        enhancedLocationService.stopWatching()
      }
    }
  }, [isWatching])

  return {
    location,
    error,
    loading,
    permissionState,
    isSupported,
    requestLocation,
    requestPermission,
    startWatching,
    stopWatching,
    isWatching,
    isWithinPerimeter
  }
}

// Hook specifically for perimeter checking
export function usePerimeterCheck(perimeter: PerimeterSettings | null) {
  const { location, isWatching, startWatching, stopWatching } = useLocation({ watch: true })
  const [isWithinPerimeter, setIsWithinPerimeter] = useState<boolean | null>(null)
  const [distanceFromCenter, setDistanceFromCenter] = useState<number | null>(null)
  const previousWithinState = useRef<boolean | null>(null)

  useEffect(() => {
    if (!location || !perimeter) {
      setIsWithinPerimeter(null)
      setDistanceFromCenter(null)
      return
    }

    const distance = enhancedLocationService.calculateDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: perimeter.centerLatitude, longitude: perimeter.centerLongitude }
    )

    const withinPerimeter = distance <= perimeter.radiusInMeters

    setDistanceFromCenter(distance)
    setIsWithinPerimeter(withinPerimeter)

    // Detect perimeter entry/exit
    if (previousWithinState.current !== null && previousWithinState.current !== withinPerimeter) {
      const event = new CustomEvent('perimeterChange', {
        detail: {
          entered: withinPerimeter,
          exited: !withinPerimeter,
          distance,
          location
        }
      })
      window.dispatchEvent(event)
    }

    previousWithinState.current = withinPerimeter
  }, [location, perimeter])

  return {
    location,
    isWithinPerimeter,
    distanceFromCenter,
    isWatching,
    startWatching,
    stopWatching
  }
}
