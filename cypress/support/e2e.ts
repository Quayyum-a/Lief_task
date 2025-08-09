// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests in command log for cleaner output
const app = window.top

if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style')
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }'
  style.setAttribute('data-hide-command-log-request', '')
  app.document.head.appendChild(style)
}

// Global test configuration
beforeEach(() => {
  // Clear local storage
  cy.clearLocalStorage()
  
  // Clear session storage
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })
  
  // Mock console methods to prevent test pollution
  cy.window().then((win) => {
    cy.stub(win.console, 'log')
    cy.stub(win.console, 'warn')
    cy.stub(win.console, 'error')
  })
  
  // Set up default notification permission
  cy.window().then((win) => {
    if ('Notification' in win) {
      Object.defineProperty(win.Notification, 'permission', {
        writable: true,
        value: 'granted'
      })
    }
  })
  
  // Mock default successful geolocation
  cy.mockGeolocation(
    Cypress.env('TIMES_SQUARE_LAT'),
    Cypress.env('TIMES_SQUARE_LNG'),
    15
  )
  
  // Mock geolocation permission as granted
  cy.mockGeolocationPermission('granted')
})
