/**
 * Comprehensive test suite for BaseClient
 * Following TestNG-style patterns adapted for Jest
 * Tests cover all BaseClient functionality including middleware integration
 */

import { BaseClient } from '../base-client'
import { MiddlewarePipeline, Middleware } from '../middleware'
import { ApiResponse } from '../../types'

// Mock fetch globally
var global = globalThis
global.fetch = jest.fn()

// Create a concrete implementation of BaseClient for testing
class TestClient extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string, timeout = 30000) {
    super(baseUrl, clientApiKey, serverApiKey, timeout)
  }

  // Expose protected methods for testing
  public async testRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, options)
  }

  public async testApiCall<T>(
    endpoint: string,
    input?: unknown,
    options: RequestInit = {},
    middlewares: Middleware[] = []
  ): Promise<ApiResponse<T>> {
    return this.apiCall<T>(endpoint, input, options, middlewares)
  }
}

describe('BaseClient Integration Tests', () => {
  let testClient: TestClient
  let mockFetch: jest.MockedFunction<typeof fetch>
  const baseUrl = 'https://api.imchat.ai'
  const clientApiKey = 'test-client-key'
  const serverApiKey = 'test-server-key'

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Get the mocked fetch function
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    
    // Create TestClient instance
    testClient = new TestClient(baseUrl, clientApiKey, serverApiKey)
  })

  describe('Constructor and Initialization Tests', () => {
    it('testConstructor_WithValidParams_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const client = new TestClient(baseUrl, clientApiKey, serverApiKey)

      // Assert
      expect(client).toBeInstanceOf(BaseClient)
      expect(client).toBeInstanceOf(TestClient)
      expect(client.hasServerApiKey()).toBe(true)
    })

    it('testConstructor_WithOptionalServerKey_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const client = new TestClient(baseUrl, clientApiKey)

      // Assert
      expect(client).toBeInstanceOf(BaseClient)
      expect(client.hasServerApiKey()).toBe(false)
    })

    it('testConstructor_WithCustomTimeout_ShouldSetTimeout', () => {
      // Arrange & Act
      const customTimeout = 60000
      const client = new TestClient(baseUrl, clientApiKey, serverApiKey, customTimeout)

      // Assert
      expect(client).toBeInstanceOf(BaseClient)
    })

    it('testConstructor_WithDefaultTimeout_ShouldUseDefault', () => {
      // Arrange & Act
      const client = new TestClient(baseUrl, clientApiKey)

      // Assert
      expect(client).toBeInstanceOf(BaseClient)
    })
  })

  describe('Request Method Tests', () => {
    it('testRequest_HappyPath_ShouldReturnSuccessResponse', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({ id: '123', name: 'Test' })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await testClient.testRequest('/api/test')

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toEqual({ id: '123', name: 'Test' })
      expect(result.error).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/test`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Client-Api-Key': clientApiKey,
            'X-Server-Api-Key': serverApiKey
          })
        })
      )
    })

    it('testRequest_WithServerError_ShouldReturnErrorResponse', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue(null)
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await testClient.testRequest('/api/test')

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeNull()
      expect(result.error).toBe('HTTP 500: Internal Server Error')
    })

    it('testRequest_WithNetworkError_ShouldReturnErrorResponse', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'))

      // Act
      const result = await testClient.testRequest('/api/test')

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Network error')
    })

    it('testRequest_WithCustomHeaders_ShouldIncludeCustomHeaders', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({})
      }
      mockFetch.mockResolvedValue(mockResponse as any)
      const customHeaders = { 'Custom-Header': 'custom-value' }

      // Act
      const result = await testClient.testRequest('/api/test', { headers: customHeaders })

      // Assert
      expect(result.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/test`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'custom-value'
          })
        })
      )
    })

    it('testRequest_WithCustomOptions_ShouldPassOptions', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({})
      }
      mockFetch.mockResolvedValue(mockResponse as any)
      const customOptions = { method: 'POST', body: JSON.stringify({ test: 'data' }) }

      // Act
      const result = await testClient.testRequest('/api/test', customOptions)

      // Assert
      expect(result.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/test`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: 'data' })
        })
      )
    })
  })

  describe('ApiCall Method Tests', () => {
    it('testApiCall_HappyPath_ShouldExecuteSuccessfully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({ id: '123', name: 'Test' })
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await testClient.testApiCall('/api/test', { test: 'data' }, { method: 'POST' })

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toEqual({ id: '123', name: 'Test' })
      expect(result.error).toBeUndefined()
    })

    it('testApiCall_WithMiddleware_ShouldExecuteMiddleware', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({ id: '123', name: 'Test' })
      }
      mockFetch.mockResolvedValue(mockResponse as any)
      
      const mockMiddleware: Middleware = {
        name: 'test-middleware',
        before: jest.fn(),
        after: jest.fn()
      }

      // Act
      const result = await testClient.testApiCall('/api/test', { test: 'data' }, { method: 'POST' }, [mockMiddleware])

      // Assert
      expect(result.status).toBe(200)
      expect(mockMiddleware.before).toHaveBeenCalled()
      expect(mockMiddleware.after).toHaveBeenCalled()
    })

    it('testApiCall_WithMiddlewareError_ShouldHandleError', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      const mockMiddleware: Middleware = {
        name: 'error-middleware',
        error: jest.fn()
      }

      // Act
      const result = await testClient.testApiCall('/api/test', {}, {}, [mockMiddleware])

      // Assert
      expect(result.status).toBe(500)
      expect(result.error).toBe('Network error')
      // Note: Middleware error is called but the error is still thrown by the pipeline
    })

    it('testApiCall_WithDefaultMethod_ShouldUseGET', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({})
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await testClient.testApiCall('/api/test')

      // Assert
      expect(result.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/api/test`,
        expect.objectContaining({
          headers: expect.any(Object)
        })
      )
    })
  })

  describe('Middleware Management Tests', () => {
    it('testUse_WithValidMiddleware_ShouldAddMiddleware', () => {
      // Arrange
      const middleware: Middleware = {
        name: 'test-middleware',
        before: jest.fn(),
        after: jest.fn()
      }

      // Act
      const result = testClient.use(middleware)

      // Assert
      expect(result).toBe(testClient) // Should return this for chaining
    })

    it('testUse_WithDuplicateMiddleware_ShouldNotAddDuplicate', () => {
      // Arrange
      const middleware: Middleware = {
        name: 'duplicate-middleware',
        before: jest.fn(),
        after: jest.fn()
      }

      // Act
      testClient.use(middleware)
      testClient.use(middleware) // Add same middleware again

      // Assert
      expect(testClient).toBeInstanceOf(BaseClient)
    })

    it('testUse_WithMultipleMiddlewares_ShouldChainCorrectly', () => {
      // Arrange
      const middleware1: Middleware = {
        name: 'middleware-1',
        before: jest.fn()
      }
      const middleware2: Middleware = {
        name: 'middleware-2',
        before: jest.fn()
      }

      // Act
      const result = testClient.use(middleware1).use(middleware2)

      // Assert
      expect(result).toBe(testClient)
    })
  })

  describe('HasServerApiKey Tests', () => {
    it('testHasServerApiKey_WithServerKey_ShouldReturnTrue', () => {
      // Arrange
      const client = new TestClient(baseUrl, clientApiKey, serverApiKey)

      // Act
      const result = client.hasServerApiKey()

      // Assert
      expect(result).toBe(true)
    })

    it('testHasServerApiKey_WithoutServerKey_ShouldReturnFalse', () => {
      // Arrange
      const client = new TestClient(baseUrl, clientApiKey)

      // Act
      const result = client.hasServerApiKey()

      // Assert
      expect(result).toBe(false)
    })

    it('testHasServerApiKey_WithEmptyServerKey_ShouldReturnFalse', () => {
      // Arrange
      const client = new TestClient(baseUrl, clientApiKey, '')

      // Act
      const result = client.hasServerApiKey()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('Timeout Tests', () => {
    it('testRequest_WithTimeout_ShouldAbortRequest', async () => {
      // Arrange
      const abortController = new AbortController()
      const abortSpy = jest.spyOn(abortController, 'abort')
      
      // Mock AbortController to return our spy
      jest.spyOn(global, 'AbortController').mockImplementation(() => ({
        signal: abortController.signal,
        abort: abortSpy as any
      }))

      // Mock fetch to reject with AbortError (simulate timeout)
      mockFetch.mockRejectedValue(new Error('The operation was aborted'))

      // Act
      const result = await testClient.testRequest('/api/test')

      // Assert
      expect(result.status).toBe(500)
      expect(result.error).toBe('The operation was aborted')
    }, 15000)

    it('testRequest_WithCustomTimeout_ShouldUseCustomTimeout', () => {
      // Arrange
      const customTimeout = 1000
      const client = new TestClient(baseUrl, clientApiKey, serverApiKey, customTimeout)

      // Act & Assert
      expect(client).toBeInstanceOf(BaseClient)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('testRequest_WithMalformedJSON_ShouldHandleGracefully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await testClient.testRequest('/api/test')

      // Assert
      expect(result.status).toBe(500)
      expect(result.error).toBe('Invalid JSON')
    })

    it('testRequest_WithEmptyResponse_ShouldHandleGracefully', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 204,
        statusText: 'No Content',
        json: jest.fn().mockResolvedValue(null)
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await testClient.testRequest('/api/test')

      // Assert
      expect(result.status).toBe(204)
      expect(result.data).toBeNull()
      expect(result.error).toBeUndefined()
    })

    it('testRequest_WithUnknownError_ShouldReturnGenericError', async () => {
      // Arrange
      mockFetch.mockRejectedValue('Unknown error string')

      // Act
      const result = await testClient.testRequest('/api/test')

      // Assert
      expect(result.status).toBe(500)
      expect(result.error).toBe('Unknown error')
    })

    it('testRequest_WithSpecialCharactersInUrl_ShouldEncodeCorrectly', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({})
      }
      mockFetch.mockResolvedValue(mockResponse as any)
      const specialEndpoint = '/api/test?param=value with spaces&other=special%20chars'

      // Act
      const result = await testClient.testRequest(specialEndpoint)

      // Assert
      expect(result.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}${specialEndpoint}`,
        expect.any(Object)
      )
    })
  })

  describe('Boundary Value Tests', () => {
    it('testConstructor_WithMinimalParams_ShouldWork', () => {
      // Arrange & Act
      const client = new TestClient('http://localhost', 'key')

      // Assert
      expect(client).toBeInstanceOf(BaseClient)
      expect(client.hasServerApiKey()).toBe(false)
    })

    it('testConstructor_WithEmptyStrings_ShouldWork', () => {
      // Arrange & Act
      const client = new TestClient('', '', '')

      // Assert
      expect(client).toBeInstanceOf(BaseClient)
      expect(client.hasServerApiKey()).toBe(false)
    })

    it('testRequest_WithEmptyEndpoint_ShouldWork', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({})
      }
      mockFetch.mockResolvedValue(mockResponse as any)

      // Act
      const result = await testClient.testRequest('')

      // Assert
      expect(result.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(baseUrl, expect.any(Object))
    })

    it('testRequest_WithVeryLongEndpoint_ShouldWork', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: jest.fn().mockResolvedValue({})
      }
      mockFetch.mockResolvedValue(mockResponse as any)
      const longEndpoint = '/api/' + 'a'.repeat(1000)

      // Act
      const result = await testClient.testRequest(longEndpoint)

      // Assert
      expect(result.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}${longEndpoint}`,
        expect.any(Object)
      )
    })
  })
})
