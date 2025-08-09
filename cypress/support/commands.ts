/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Mock geolocation to return specific coordinates
       */
      mockGeolocation(latitude: number, longitude: number, accuracy?: number): Chainable<void>
      
      /**
       * Mock geolocation permission state
       */
      mockGeolocationPermission(state: 'granted' | 'denied' | 'prompt'): Chainable<void>
      
      /**
       * Mock geolocation error
       */
      mockGeolocationError(code: number, message: string): Chainable<void>
      
      /**
       * Simulate location change
       */
      simulateLocationChange(latitude: number, longitude: number, accuracy?: number): Chainable<void>
      
      /**
       * Wait for location to be detected
       */
      waitForLocation(timeout?: number): Chainable<void>
      
      /**
       * Check if element is within perimeter indicator
       */
      checkPerimeterStatus(expectedStatus: 'inside' | 'outside'): Chainable<void>
      
      /**
       * Login as test user
       */
      loginAsWorker(): Chainable<void>
      
      /**
       * Login as manager
       */
      loginAsManager(): Chainable<void>
      
      /**
       * Clear all notifications
       */
      clearNotifications(): Chainable<void>
    }
  }
}

// Mock geolocation API
Cypress.Commands.add('mockGeolocation', (latitude: number, longitude: number, accuracy = 10) => {
  cy.window().then((win) => {
    const mockGeolocation = {
      getCurrentPosition: cy.stub().callsFake((success: Function) => {
        const position = {
          coords: {
            latitude,
            longitude,
            accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        }
        success(position)
      }),
      
      watchPosition: cy.stub().callsFake((success: Function, error: Function, options: any) => {
        const position = {
          coords: {
            latitude,
            longitude,
            accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        }
        success(position)
        return 1 // watchId
      }),
      
      clearWatch: cy.stub()
    }
    
    cy.stub(win.navigator, 'geolocation').value(mockGeolocation)
  })
})

// Mock geolocation permission
Cypress.Commands.add('mockGeolocationPermission', (state: 'granted' | 'denied' | 'prompt') => {
  cy.window().then((win) => {
    // Mock navigator.permissions.query
    const mockPermissions = {
      query: cy.stub().resolves({
        state,
        onchange: null,
        addEventListener: cy.stub(),
        removeEventListener: cy.stub()
      })
    }
    cy.stub(win.navigator, 'permissions').value(mockPermissions)
  })
})

// Mock geolocation error
Cypress.Commands.add('mockGeolocationError', (code: number, message: string) => {
  cy.window().then((win) => {
    const mockGeolocation = {
      getCurrentPosition: cy.stub().callsFake((success: Function, error: Function) => {
        const positionError = {
          code,
          message,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        }
        error(positionError)
      }),
      
      watchPosition: cy.stub().callsFake((success: Function, error: Function) => {
        const positionError = {
          code,
          message,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        }
        error(positionError)
        return 1
      }),
      
      clearWatch: cy.stub()
    }
    
    cy.stub(win.navigator, 'geolocation').value(mockGeolocation)
  })
})

// Simulate location change (for testing location updates)
Cypress.Commands.add('simulateLocationChange', (latitude: number, longitude: number, accuracy = 10) => {
  cy.window().then((win) => {
    // Trigger a location update event
    const locationEvent = new CustomEvent('locationUpdate', {
      detail: {
        coords: {
          latitude,
          longitude,
          accuracy
        },
        timestamp: Date.now()
      }
    })
    win.dispatchEvent(locationEvent)
  })
})

// Wait for location to be detected
Cypress.Commands.add('waitForLocation', (timeout = 10000) => {
  cy.get('[data-testid="location-status"]', { timeout })
    .should('not.contain', 'Getting your location')
    .should('not.contain', 'Loading')
})

// Check perimeter status
Cypress.Commands.add('checkPerimeterStatus', (expectedStatus: 'inside' | 'outside') => {
  const expectedText = expectedStatus === 'inside' ? 'Within Perimeter' : 'Outside Perimeter'
  const expectedColor = expectedStatus === 'inside' ? 'green' : 'red'
  
  cy.get('[data-testid="perimeter-status"]')
    .should('contain', expectedText)
    .and('have.class', expectedColor === 'green' ? 'ant-tag-green' : 'ant-tag-red')
})

// Login helpers
Cypress.Commands.add('loginAsWorker', () => {
  // Mock authentication for worker
  cy.window().then((win) => {
    win.localStorage.setItem('mockUser', JSON.stringify({
      id: 'test-worker-1',
      email: Cypress.env('TEST_USER_EMAIL'),
      name: 'Test Worker',
      role: 'worker',
      image: null
    }))
  })
  
  // Mock session
  cy.intercept('GET', '/api/auth/session', {
    fixture: 'worker-session.json'
  }).as('getSession')
})

Cypress.Commands.add('loginAsManager', () => {
  // Mock authentication for manager
  cy.window().then((win) => {
    win.localStorage.setItem('mockUser', JSON.stringify({
      id: 'test-manager-1',
      email: Cypress.env('TEST_MANAGER_EMAIL'),
      name: 'Test Manager',
      role: 'manager',
      image: null
    }))
  })
  
  // Mock session
  cy.intercept('GET', '/api/auth/session', {
    fixture: 'manager-session.json'
  }).as('getSession')
})

// Clear notifications
Cypress.Commands.add('clearNotifications', () => {
  cy.window().then((win) => {
    // Clear any existing notifications
    if ('Notification' in win) {
      // Close all notifications
      win.postMessage({ type: 'CLEAR_NOTIFICATIONS' }, '*')
    }
    
    // Clear localStorage notifications if any
    win.localStorage.removeItem('notifications')
  })
})

// Mock notification permission
Cypress.Commands.add('mockNotificationPermission', (permission: NotificationPermission) => {
  cy.window().then((win) => {
    if ('Notification' in win) {
      Object.defineProperty(win.Notification, 'permission', {
        writable: true,
        value: permission
      })
      
      Object.defineProperty(win.Notification, 'requestPermission', {
        writable: true,
        value: cy.stub().resolves(permission)
      })
    }
  })
})
