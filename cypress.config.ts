import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      
      // Task to mock geolocation
      on('task', {
        mockGeolocation({ latitude, longitude, accuracy = 10 }) {
          return null
        },
        
        log(message) {
          console.log(message)
          return null
        }
      })
    },
    
    // Test files configuration
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    excludeSpecPattern: [
      '**/node_modules/**',
      '**/dist/**'
    ],
    
    // Browser configuration
    chromeWebSecurity: false,
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    // Test isolation
    testIsolation: true,
    
    env: {
      // Environment variables for tests
      TEST_USER_EMAIL: 'test@hospital.com',
      TEST_MANAGER_EMAIL: 'manager@hospital.com',
      TIMES_SQUARE_LAT: 40.7831,
      TIMES_SQUARE_LNG: -73.9712,
      TEST_PERIMETER_RADIUS: 500
    }
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      // Component testing setup
    },
  },
})
