/**
 * Jest test setup file
 * Configures global test environment and mocks
 */

// Mock fetch globally for all tests
var global = globalThis
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Setup global test timeout
jest.setTimeout(10000)

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})
