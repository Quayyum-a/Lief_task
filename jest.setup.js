// Jest DOM setup for testing React components
import '@testing-library/jest-dom'

// Mock window.matchMedia for Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
})

// Mock notifications API
if (typeof global.Notification === 'undefined') {
  global.Notification = class MockNotification {
    static permission = 'granted'
    static requestPermission = jest.fn(() => Promise.resolve('granted'))
    
    constructor(title, options) {
      this.title = title
      this.options = options
    }
    
    onclick = null
    close = jest.fn()
  }
} else {
  Object.defineProperty(global.Notification, 'permission', {
    writable: true,
    value: 'granted',
  })

  Object.defineProperty(global.Notification, 'requestPermission', {
    writable: true,
    value: jest.fn(() => Promise.resolve('granted')),
  })
}

// Mock service worker
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve({
      sync: {
        register: jest.fn(),
      },
    }),
    register: jest.fn(() => Promise.resolve()),
  },
})

// Suppress console errors in tests unless debugging
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
  }
}
