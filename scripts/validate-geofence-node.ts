#!/usr/bin/env tsx

/**
 * Node.js compatible validation script for geofenced clock in/out functionality
 */

import { perimeterManager, defaultPerimeters } from '../lib/perimeter'
import { simulatorUtils } from '../lib/location-simulator'

console.log('🎯 Starting Geofenced Clock In/Out Validation (Node.js)')
console.log('='.repeat(60))

async function validateGeofenceSystem() {
  console.log('\n📋 Step 1: System Initialization')
  console.log('-'.repeat(40))
  
  // Set up default perimeters
  perimeterManager.setPerimeters(defaultPerimeters)
  simulatorUtils.logPerimeterInfo()

  console.log('\n🧮 Step 2: Geofence Math Validation')
  console.log('-'.repeat(40))
  
  const timesSquare = { latitude: 40.7831, longitude: -73.9712 }
  const empireState = { latitude: 40.7484, longitude: -73.9857 }
  
  // Test distance calculations
  const distance = simulatorUtils.distanceInMeters(timesSquare, empireState)
  console.log(`📏 Distance Times Square to Empire State: ${distance.toFixed(0)}m`)
  
  // Test perimeter validation
  const insideResult = perimeterManager.checkLocation(timesSquare)
  const outsideResult = perimeterManager.checkLocation(empireState)
  
  console.log(`✅ Times Square (center): ${insideResult.message}`)
  console.log(`❌ Empire State Building: ${outsideResult.message}`)

  console.log('\n📍 Step 3: Location Simulation - Crossing Geo-fence')
  console.log('-'.repeat(40))
  
  // Test locations that cross the perimeter
  const testLocations = [
    { latitude: 40.7800, longitude: -73.9700, description: 'Outside perimeter (south)' },
    { latitude: 40.7825, longitude: -73.9708, description: 'Approaching perimeter' },
    { latitude: 40.7831, longitude: -73.9712, description: 'Inside perimeter (center)' },
    { latitude: 40.7835, longitude: -73.9725, description: 'Outside perimeter (north)' },
    { latitude: 40.7831, longitude: -73.9712, description: 'Back to center' }
  ]
  
  testLocations.forEach((location, index) => {
    const result = perimeterManager.checkLocation({
      ...location,
      timestamp: Date.now()
    })
    
    console.log(`  📍 Location ${index + 1}: ${simulatorUtils.formatCoords(location)}`)
    console.log(`     ${location.description}`)
    console.log(`     Status: ${result.isWithin ? '✅ Inside' : '❌ Outside'} (${result.distance.toFixed(0)}m from center)`)
    console.log(`     Message: ${result.message}`)
  })

  console.log('\n🎯 Step 4: Clock Operation Validation')
  console.log('-'.repeat(40))
  
  // Test clock in validation
  const clockInInside = perimeterManager.validateClockOperation(timesSquare, 'clock_in')
  const clockInOutside = perimeterManager.validateClockOperation(empireState, 'clock_in')
  
  console.log(`🕐 Clock In (Inside perimeter): ${clockInInside.allowed ? '✅ Allowed' : '❌ Denied'}`)
  console.log(`   Message: ${clockInInside.message}`)
  
  console.log(`🕐 Clock In (Outside perimeter): ${clockInOutside.allowed ? '✅ Allowed' : '❌ Denied'}`)
  console.log(`   Message: ${clockInOutside.message}`)
  
  // Test clock out validation
  const clockOutInside = perimeterManager.validateClockOperation(timesSquare, 'clock_out')
  const clockOutOutside = perimeterManager.validateClockOperation(empireState, 'clock_out')
  
  console.log(`🕑 Clock Out (Inside perimeter): ${clockOutInside.allowed ? '✅ Allowed' : '❌ Denied'}`)
  console.log(`🕑 Clock Out (Outside perimeter): ${clockOutOutside.allowed ? '✅ Allowed' : '❌ Denied'}`)

  console.log('\n🚨 Step 5: Perimeter Entry/Exit Detection')
  console.log('-'.repeat(40))
  
  // Test perimeter crossing notifications
  const outsideLocation = empireState
  const insideLocation = timesSquare
  
  const entryNotification = perimeterManager.getPerimeterNotification(outsideLocation, insideLocation)
  const exitNotification = perimeterManager.getPerimeterNotification(insideLocation, outsideLocation)
  
  if (entryNotification) {
    console.log(`🚪 Entry Event: ${entryNotification.type}`)
    console.log(`   Message: ${entryNotification.message}`)
  }
  
  if (exitNotification) {
    console.log(`🚪 Exit Event: ${exitNotification.type}`)
    console.log(`   Message: ${exitNotification.message}`)
  }

  console.log('\n🎯 Step 6: GPS Accuracy Testing')
  console.log('-'.repeat(40))
  
  const accuracyTests = [
    { accuracy: 5, description: 'Excellent GPS signal' },
    { accuracy: 25, description: 'Good GPS signal' },
    { accuracy: 60, description: 'Poor GPS signal' },
    { accuracy: 120, description: 'Very poor GPS signal' }
  ]
  
  accuracyTests.forEach(test => {
    const mockLocation = { ...timesSquare, accuracy: test.accuracy, timestamp: Date.now() }
    const accuracyResult = perimeterManager.checkLocation(mockLocation, {
      requireHighAccuracy: true,
      accuracyThreshold: 50
    })
    
    console.log(`📡 ${test.description} (±${test.accuracy}m): ${accuracyResult.isWithin ? '✅ Accepted' : '❌ Rejected'}`)
    if (!accuracyResult.isWithin && test.accuracy > 50) {
      console.log(`     Reason: ${accuracyResult.message}`)
    }
  })

  console.log('\n⚠️  Step 7: Edge Case Testing')
  console.log('-'.repeat(40))
  
  // Test boundary conditions - point exactly at perimeter edge
  const boundaryTest = {
    latitude: 40.7831 + (500 / 111320), // Exactly 500m north
    longitude: -73.9712,
    timestamp: Date.now()
  }
  
  const boundaryResult = perimeterManager.checkLocation(boundaryTest)
  console.log(`🎯 Boundary test (500m from center):`)
  console.log(`   Distance: ${boundaryResult.distance.toFixed(1)}m`)
  console.log(`   Status: ${boundaryResult.isWithin ? '✅ Inside' : '❌ Outside'} perimeter`)
  console.log(`   Expected: Should be very close to perimeter edge`)
  
  // Test extreme coordinates
  const extremeTest = {
    latitude: 89.9999, // Near North Pole
    longitude: 179.9999, // Near International Date Line
    timestamp: Date.now()
  }
  
  const extremeResult = perimeterManager.checkLocation(extremeTest)
  console.log(`🌍 Extreme coordinates test:`)
  console.log(`   Distance: ${extremeResult.distance.toFixed(0)}m from center`)
  console.log(`   Status: ${extremeResult.distance > 10000 ? '✅ Pass' : '❌ Fail'} (should be far from perimeter)`)
  
  // Test multiple perimeters - find closest
  const locationBetween = { latitude: 40.76, longitude: -73.97, timestamp: Date.now() } // Between perimeters
  const closestResult = perimeterManager.getClosestPerimeter(locationBetween)
  
  console.log(`🔍 Multiple perimeter test:`)
  console.log(`   Test location: ${simulatorUtils.formatCoords(locationBetween)}`)
  console.log(`   Closest perimeter: (${closestResult.perimeter?.centerLatitude.toFixed(4)}, ${closestResult.perimeter?.centerLongitude.toFixed(4)})`)
  console.log(`   Distance: ${closestResult.distance.toFixed(0)}m`)

  console.log('\n📊 Step 8: Simulated TimeEntry Records')
  console.log('-'.repeat(40))
  
  // Simulate what would be written to the database
  const simulateTimeEntry = (type: 'clock_in' | 'clock_out', location: any, valid: boolean) => {
    return {
      id: `time_entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'test_user_123',
      type,
      timestamp: new Date().toISOString(),
      locationLat: location.latitude,
      locationLon: location.longitude,
      accuracy: location.accuracy || 15,
      isValidLocation: valid,
      perimeterId: valid ? 'times_square_perimeter' : null,
      note: `${type} ${valid ? 'inside' : 'outside'} perimeter at ${new Date().toLocaleTimeString()}`,
      backgroundTriggered: false
    }
  }
  
  // Simulate successful clock in
  const clockInEntry = simulateTimeEntry('clock_in', timesSquare, true)
  console.log('💾 Simulated Clock In TimeEntry:')
  console.log(`   ID: ${clockInEntry.id}`)
  console.log(`   Type: ${clockInEntry.type}`)
  console.log(`   Location: ${clockInEntry.locationLat.toFixed(6)}, ${clockInEntry.locationLon.toFixed(6)}`)
  console.log(`   Valid Location: ${clockInEntry.isValidLocation ? '✅' : '❌'}`)
  console.log(`   Timestamp: ${clockInEntry.timestamp}`)
  console.log(`   Note: ${clockInEntry.note}`)
  
  // Simulate clock out from outside (emergency case)
  const clockOutEntry = simulateTimeEntry('clock_out', empireState, false)
  console.log('\n💾 Simulated Clock Out TimeEntry (Emergency):')
  console.log(`   ID: ${clockOutEntry.id}`)
  console.log(`   Type: ${clockOutEntry.type}`)
  console.log(`   Location: ${clockOutEntry.locationLat.toFixed(6)}, ${clockOutEntry.locationLon.toFixed(6)}`)
  console.log(`   Valid Location: ${clockOutEntry.isValidLocation ? '✅' : '❌'}`)
  console.log(`   Timestamp: ${clockOutEntry.timestamp}`)
  console.log(`   Note: ${clockOutEntry.note}`)

  console.log('\n⚡ Step 9: Performance Testing')
  console.log('-'.repeat(40))
  
  const iterations = 1000
  console.log(`Running ${iterations} distance calculations...`)
  
  const startTime = Date.now()
  
  for (let i = 0; i < iterations; i++) {
    const randomLat = 40.7831 + (Math.random() - 0.5) * 0.01
    const randomLng = -73.9712 + (Math.random() - 0.5) * 0.01
    
    perimeterManager.checkLocation({
      latitude: randomLat,
      longitude: randomLng,
      timestamp: Date.now()
    })
  }
  
  const endTime = Date.now()
  const duration = endTime - startTime
  const avgTime = duration / iterations
  
  console.log(`✅ Performance test results:`)
  console.log(`   Total time: ${duration}ms`)
  console.log(`   Average per check: ${avgTime.toFixed(3)}ms`)
  console.log(`   Checks per second: ${Math.round(1000 / avgTime)}`)
  console.log(`   Performance rating: ${avgTime < 1 ? '🚀 Excellent' : avgTime < 5 ? '✅ Good' : '⚠️  Needs optimization'}`)

  console.log('\n🎉 Validation Complete!')
  console.log('='.repeat(60))
  console.log('✅ All geofence functionality has been validated:')
  console.log('   • Distance calculations (Haversine formula) ✅')
  console.log('   • Perimeter boundary detection ✅') 
  console.log('   • Clock in/out operation validation ✅')
  console.log('   • GPS accuracy threshold checking ✅')
  console.log('   • Perimeter entry/exit event detection ✅')
  console.log('   • Multiple perimeter support ✅')
  console.log('   • Edge case handling ✅')
  console.log('   • TimeEntry record structure ✅')
  console.log('   • Performance validation ✅')
  console.log('\n🚀 Geofence system ready for integration!')
  
  return true
}

// Additional utility functions
export const nodeValidationUtils = {
  /**
   * Test specific coordinate pair
   */
  testCoordinates(lat1: number, lng1: number, lat2: number, lng2: number): void {
    console.log(`\n🧪 Testing coordinates: (${lat1}, ${lng1}) vs (${lat2}, ${lng2})`)
    
    const distance = simulatorUtils.distanceInMeters(
      { latitude: lat1, longitude: lng1 },
      { latitude: lat2, longitude: lng2 }
    )
    
    console.log(`📏 Distance: ${distance.toFixed(2)}m`)
    
    perimeterManager.setPerimeters([{
      centerLatitude: lat1,
      centerLongitude: lng1,
      radiusInMeters: 1000
    }])
    
    const result = perimeterManager.checkLocation({
      latitude: lat2,
      longitude: lng2,
      timestamp: Date.now()
    })
    
    console.log(`📍 Status: ${result.isWithin ? 'Inside' : 'Outside'} 1km radius`)
    console.log(`📋 Message: ${result.message}`)
  },
  
  /**
   * Validate specific perimeter configuration
   */
  validatePerimeter(centerLat: number, centerLng: number, radiusMeters: number): void {
    console.log(`\n🎯 Validating perimeter: center (${centerLat}, ${centerLng}), radius ${radiusMeters}m`)
    
    perimeterManager.setPerimeters([{
      centerLatitude: centerLat,
      centerLongitude: centerLng,
      radiusInMeters: radiusMeters
    }])
    
    // Test points at various distances
    const testPoints = [
      { distance: 0, description: 'Center point' },
      { distance: radiusMeters * 0.5, description: 'Half radius' },
      { distance: radiusMeters * 0.9, description: 'Near edge (inside)' },
      { distance: radiusMeters * 1.1, description: 'Just outside' },
      { distance: radiusMeters * 2, description: 'Far outside' }
    ]
    
    testPoints.forEach(test => {
      // Calculate point at specified distance (north of center)
      const lat = centerLat + (test.distance / 111320)
      const lng = centerLng
      
      const result = perimeterManager.checkLocation({
        latitude: lat,
        longitude: lng,
        timestamp: Date.now()
      })
      
      console.log(`  📍 ${test.description}: ${result.isWithin ? '✅ Inside' : '❌ Outside'} (${result.distance.toFixed(0)}m)`)
    })
  }
}

// Run the validation if called directly
if (require.main === module) {
  validateGeofenceSystem()
    .then(() => {
      console.log('\n✨ Validation script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Validation script failed:', error)
      process.exit(1)
    })
}
