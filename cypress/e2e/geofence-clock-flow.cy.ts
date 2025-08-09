/// <reference types="cypress" />

describe('Geofenced Clock In/Out Flow', () => {
  const TIMES_SQUARE = {
    lat: 40.7831,
    lng: -73.9712
  }
  
  const EMPIRE_STATE = {
    lat: 40.7484,
    lng: -73.9857
  }

  beforeEach(() => {
    // Clear any existing data
    cy.clearNotifications()
    
    // Mock successful authentication
    cy.loginAsWorker()
    
    // Visit the worker dashboard
    cy.visit('/worker')
  })

  describe('Location Detection and Perimeter Validation', () => {
    it('should detect when user is within perimeter', () => {
      // Mock location at Times Square (inside default perimeter)
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 10)
      
      // Wait for location to be detected
      cy.waitForLocation()
      
      // Check that perimeter status shows "inside"
      cy.checkPerimeterStatus('inside')
      
      // Verify location coordinates are displayed
      cy.get('[data-testid="location-coords"]')
        .should('contain', TIMES_SQUARE.lat.toFixed(6))
        .should('contain', TIMES_SQUARE.lng.toFixed(6))
      
      // Verify accuracy is displayed
      cy.get('[data-testid="location-accuracy"]')
        .should('contain', '10m')
    })

    it('should detect when user is outside perimeter', () => {
      // Mock location at Empire State Building (outside Times Square perimeter)
      cy.mockGeolocation(EMPIRE_STATE.lat, EMPIRE_STATE.lng, 15)
      
      // Wait for location to be detected
      cy.waitForLocation()
      
      // Check that perimeter status shows "outside"
      cy.checkPerimeterStatus('outside')
      
      // Verify warning message is displayed
      cy.get('[data-testid="perimeter-warning"]')
        .should('be.visible')
        .should('contain', 'Cannot Clock In')
    })

    it('should handle poor GPS accuracy', () => {
      // Mock location with poor accuracy (>50m)
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 100)
      
      cy.waitForLocation()
      
      // Should show accuracy warning
      cy.get('[data-testid="accuracy-warning"]')
        .should('be.visible')
        .should('contain', 'GPS accuracy is low')
    })

    it('should handle geolocation errors gracefully', () => {
      // Mock geolocation permission denied
      cy.mockGeolocationError(1, 'User denied geolocation')
      
      cy.visit('/worker')
      
      // Should show error message
      cy.get('[data-testid="location-error"]')
        .should('be.visible')
        .should('contain', 'Location Error')
    })
  })

  describe('Clock In Flow', () => {
    it('should successfully clock in when within perimeter', () => {
      // Mock location inside perimeter
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 10)
      cy.waitForLocation()
      
      // Verify clock in button is enabled
      cy.get('[data-testid="clock-in-btn"]')
        .should('not.be.disabled')
        .should('be.visible')
      
      // Add optional note
      cy.get('[data-testid="clock-note"]')
        .type('Starting my shift - feeling good today!')
      
      // Click clock in button
      cy.get('[data-testid="clock-in-btn"]').click()
      
      // Should show loading state
      cy.get('[data-testid="clock-in-btn"]')
        .should('contain', 'Loading')
        .should('be.disabled')
      
      // Should transition to clocked in state
      cy.get('[data-testid="shift-status"]', { timeout: 10000 })
        .should('contain', 'Current Shift')
      
      // Should show clock out button
      cy.get('[data-testid="clock-out-btn"]')
        .should('be.visible')
        .should('not.be.disabled')
      
      // Should display shift start time
      cy.get('[data-testid="shift-start-time"]')
        .should('be.visible')
      
      // Should display the note that was added
      cy.get('[data-testid="shift-note"]')
        .should('contain', 'Starting my shift - feeling good today!')
    })

    it('should prevent clock in when outside perimeter', () => {
      // Mock location outside perimeter
      cy.mockGeolocation(EMPIRE_STATE.lat, EMPIRE_STATE.lng, 15)
      cy.waitForLocation()
      
      // Clock in button should be disabled
      cy.get('[data-testid="clock-in-btn"]')
        .should('be.disabled')
      
      // Should show warning message
      cy.get('[data-testid="perimeter-warning"]')
        .should('contain', 'Cannot Clock In')
        .should('contain', 'within the designated perimeter')
    })

    it('should prevent clock in with poor GPS accuracy', () => {
      // Mock location with poor accuracy
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 75)
      cy.waitForLocation()
      
      // Clock in button should be disabled due to poor accuracy
      cy.get('[data-testid="clock-in-btn"]')
        .should('be.disabled')
      
      // Should show accuracy warning
      cy.get('[data-testid="accuracy-warning"]')
        .should('contain', 'GPS accuracy is low')
    })
  })

  describe('Clock Out Flow', () => {
    beforeEach(() => {
      // First clock in (simulate already clocked in state)
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 10)
      cy.waitForLocation()
      
      cy.get('[data-testid="clock-in-btn"]').click()
      
      // Wait for clock in to complete
      cy.get('[data-testid="shift-status"]', { timeout: 10000 })
        .should('contain', 'Current Shift')
    })

    it('should successfully clock out from within perimeter', () => {
      // Add clock out note
      cy.get('[data-testid="clock-note"]')
        .clear()
        .type('Finished all tasks, great day!')
      
      // Click clock out button
      cy.get('[data-testid="clock-out-btn"]').click()
      
      // Should show loading state
      cy.get('[data-testid="clock-out-btn"]')
        .should('contain', 'Loading')
        .should('be.disabled')
      
      // Should return to clock in state
      cy.get('[data-testid="clock-in-btn"]', { timeout: 10000 })
        .should('be.visible')
        .should('not.be.disabled')
      
      // Should not show current shift
      cy.get('[data-testid="shift-status"]')
        .should('not.exist')
    })

    it('should allow clock out from outside perimeter (emergency case)', () => {
      // Move outside perimeter while clocked in
      cy.mockGeolocation(EMPIRE_STATE.lat, EMPIRE_STATE.lng, 20)
      cy.waitForLocation()
      
      // Should show outside perimeter status
      cy.checkPerimeterStatus('outside')
      
      // Clock out button should still be available
      cy.get('[data-testid="clock-out-btn"]')
        .should('be.visible')
        .should('not.be.disabled')
      
      // Should be able to clock out
      cy.get('[data-testid="clock-out-btn"]').click()
      
      // Should complete successfully
      cy.get('[data-testid="clock-in-btn"]', { timeout: 10000 })
        .should('be.visible')
    })
  })

  describe('Perimeter Crossing Notifications', () => {
    it('should show notification when entering perimeter', () => {
      // Start outside perimeter
      cy.mockGeolocation(EMPIRE_STATE.lat, EMPIRE_STATE.lng, 15)
      cy.waitForLocation()
      cy.checkPerimeterStatus('outside')
      
      // Move inside perimeter
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 10)
      cy.simulateLocationChange(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 10)
      
      // Should show entry notification
      cy.get('[data-testid="notification"]', { timeout: 5000 })
        .should('be.visible')
        .should('contain', 'Entered Work Area')
      
      // Should show clock in suggestion
      cy.get('[data-testid="notification"]')
        .should('contain', 'You can now clock in')
    })

    it('should show notification when leaving perimeter during shift', () => {
      // Start inside and clock in
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 10)
      cy.waitForLocation()
      cy.get('[data-testid="clock-in-btn"]').click()
      cy.get('[data-testid="shift-status"]', { timeout: 10000 })
        .should('contain', 'Current Shift')
      
      // Move outside perimeter
      cy.mockGeolocation(EMPIRE_STATE.lat, EMPIRE_STATE.lng, 20)
      cy.simulateLocationChange(EMPIRE_STATE.lat, EMPIRE_STATE.lng, 20)
      
      // Should show exit notification
      cy.get('[data-testid="notification"]', { timeout: 5000 })
        .should('be.visible')
        .should('contain', 'Left Work Area')
      
      // Should suggest clock out
      cy.get('[data-testid="notification"]')
        .should('contain', 'Remember to clock out')
    })
  })

  describe('Background Region Monitoring', () => {
    it('should detect location changes in background', () => {
      // Enable background monitoring
      cy.window().then((win) => {
        // Access the background geofence service
        win.postMessage({ 
          type: 'START_BACKGROUND_MONITORING',
          payload: { interval: 2000 }
        }, '*')
      })
      
      // Start inside perimeter
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 10)
      cy.waitForLocation()
      
      // Simulate background location change to outside
      cy.wait(3000) // Wait for background service to start
      cy.simulateLocationChange(EMPIRE_STATE.lat, EMPIRE_STATE.lng, 15)
      
      // Should detect the change and show notification
      cy.get('[data-testid="background-event"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', 'Background location update detected')
    })

    it('should create time entries for background events', () => {
      cy.window().then((win) => {
        // Start background monitoring
        win.postMessage({ 
          type: 'START_BACKGROUND_MONITORING',
          payload: { interval: 1000 }
        }, '*')
        
        // Simulate perimeter entry in background
        setTimeout(() => {
          win.postMessage({
            type: 'SIMULATE_BACKGROUND_LOCATION',
            payload: {
              latitude: TIMES_SQUARE.lat,
              longitude: TIMES_SQUARE.lng,
              accuracy: 10
            }
          }, '*')
        }, 2000)
      })
      
      // Check for time entry creation
      cy.get('[data-testid="time-entry-log"]', { timeout: 10000 })
        .should('be.visible')
        .should('contain', 'Background entry detected')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle location service failures', () => {
      // Mock location service failure
      cy.mockGeolocationError(2, 'Position unavailable')
      
      cy.visit('/worker')
      
      // Should show appropriate error message
      cy.get('[data-testid="location-error"]')
        .should('be.visible')
        .should('contain', 'Unable to get your location')
      
      // Should offer retry option
      cy.get('[data-testid="retry-location-btn"]')
        .should('be.visible')
    })

    it('should handle network failures during clock operations', () => {
      // Mock successful location
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 10)
      cy.waitForLocation()
      
      // Mock network failure for clock in
      cy.intercept('POST', '/api/clock/in', { 
        statusCode: 500, 
        body: { error: 'Network error' }
      }).as('clockInFail')
      
      cy.get('[data-testid="clock-in-btn"]').click()
      cy.wait('@clockInFail')
      
      // Should show error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .should('contain', 'Failed to clock in')
      
      // Should offer retry
      cy.get('[data-testid="retry-btn"]')
        .should('be.visible')
    })

    it('should validate location accuracy thresholds', () => {
      // Test borderline accuracy (exactly at threshold)
      cy.mockGeolocation(TIMES_SQUARE.lat, TIMES_SQUARE.lng, 50)
      cy.waitForLocation()
      
      // Should be on the edge of acceptable
      cy.get('[data-testid="accuracy-status"]')
        .should('contain', '±50m')
      
      // Clock in should be enabled with warning
      cy.get('[data-testid="clock-in-btn"]')
        .should('not.be.disabled')
      
      cy.get('[data-testid="accuracy-warning"]')
        .should('be.visible')
    })
  })

  describe('Real-time Location Updates', () => {
    it('should update perimeter status in real-time', () => {
      // Start outside
      cy.mockGeolocation(EMPIRE_STATE.lat, EMPIRE_STATE.lng, 15)
      cy.waitForLocation()
      cy.checkPerimeterStatus('outside')
      
      // Simulate movement toward perimeter
      const steps = [
        { lat: 40.7600, lng: -73.9750 }, // Closer
        { lat: 40.7700, lng: -73.9730 }, // Even closer
        { lat: 40.7800, lng: -73.9715 }, // Almost there
        { lat: 40.7831, lng: -73.9712 }  // Inside!
      ]
      
      steps.forEach((step, index) => {
        cy.simulateLocationChange(step.lat, step.lng, 10)
        cy.wait(1000)
        
        if (index === steps.length - 1) {
          // Last step should be inside
          cy.checkPerimeterStatus('inside')
        }
      })
    })

    it('should show distance from perimeter center', () => {
      // Mock location slightly outside perimeter
      cy.mockGeolocation(40.7800, -73.9700, 10) // ~350m from Times Square
      cy.waitForLocation()
      
      // Should show distance information
      cy.get('[data-testid="distance-info"]')
        .should('be.visible')
        .should('contain', 'm from center')
      
      // Distance should be approximately 350m
      cy.get('[data-testid="distance-value"]')
        .invoke('text')
        .then((text) => {
          const distance = parseInt(text.replace(/\D/g, ''))
          expect(distance).to.be.within(300, 400) // Allow some tolerance
        })
    })
  })

  describe('Performance and Battery Optimization', () => {
    it('should throttle location updates appropriately', () => {
      let updateCount = 0
      
      cy.window().then((win) => {
        // Monitor location update frequency
        win.addEventListener('locationUpdate', () => {
          updateCount++
        })
        
        // Simulate rapid location changes
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            cy.simulateLocationChange(
              TIMES_SQUARE.lat + Math.random() * 0.001,
              TIMES_SQUARE.lng + Math.random() * 0.001,
              10
            )
          }, i * 100)
        }
      })
      
      cy.wait(2000)
      
      // Should have throttled the updates (not all 10 should have processed)
      cy.then(() => {
        expect(updateCount).to.be.lessThan(10)
        expect(updateCount).to.be.greaterThan(0)
      })
    })
  })
})
