/**
 * Comprehensive test suite for CredentialAPI
 * Following TestNG-style patterns adapted for Jest
 * Tests cover Controller → Service → Repository → DB flow simulation
 */

import { CredentialAPI } from '../credential-api'
import { BaseClient } from '../../lib/base-client'
import { ApiResponse } from '../../types'
import { Credential } from '../../types/credential'
import { CreateCredentialSchema } from '../../schemas/credential'

describe('CredentialAPI Integration Tests', () => {
  let credentialAPI: CredentialAPI
  let mockApiCall: jest.MockedFunction<any>
  const baseUrl = 'https://api.imchat.ai/'
  const clientApiKey = 'test-client-key'
  const serverApiKey = 'test-server-key'

  // Test data fixtures
  const mockCredential: Credential = {
    provider: 'openai',
    api_key: 'sk-test-key-123',
    metadata: {
      organization: 'test-org',
      environment: 'development'
    },
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }

  const mockCredentials = [
    mockCredential,
    {
      provider: 'anthropic',
      api_key: 'ant-test-key-456',
      metadata: {
        organization: 'test-org-2',
        environment: 'production'
      },
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ]

  const mockCreateData = {
    provider: 'openai',
    api_key: 'sk-new-key-789',
    metadata: {
      organization: 'new-org',
      environment: 'staging'
    }
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Create CredentialAPI instance
    credentialAPI = new CredentialAPI(baseUrl, clientApiKey, serverApiKey)
    
    // Mock the apiCall method
    mockApiCall = jest.fn();
    (credentialAPI as any).apiCall = mockApiCall
  })

  describe('Constructor and Middleware Setup', () => {
    it('testConstructor_WithValidParams_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new CredentialAPI(baseUrl, clientApiKey, serverApiKey)

      // Assert
      expect(api).toBeInstanceOf(CredentialAPI)
    })

    it('testConstructor_WithOptionalServerKey_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new CredentialAPI(baseUrl, clientApiKey)

      // Assert
      expect(api).toBeInstanceOf(CredentialAPI)
    })
  })

  describe('List Credentials Tests', () => {
    it('testList_HappyPath_ShouldReturnCredentialArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Credential[]> = {
        data: mockCredentials,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/credentials`,
        assistantId,
        {},
        expect.any(Array)
      )
    })

    it('testList_WithEmptyList_ShouldReturnEmptyArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Credential[]> = {
        data: [],
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(0)
      expect(result.error).toBeUndefined()
    })

    it('testList_WithInvalidAssistantId_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = ''
      const expectedResponse: ApiResponse<Credential[]> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID')
    })

    it('testList_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Credential[]> = {
        data: undefined,
        status: 500,
        error: 'Database connection failed'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('Create Credential Tests', () => {
    it('testCreate_HappyPath_ShouldReturnCredential', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Credential> = {
        data: mockCredential,
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create(assistantId, mockCreateData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockCredential)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/credentials`,
        { assistantId, data: mockCreateData },
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testCreate_WithValidationError_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const invalidData = { provider: '', api_key: '' }
      const expectedResponse: ApiResponse<Credential> = {
        data: undefined,
        status: 400,
        error: 'Validation failed: provider and api_key are required'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create(assistantId, invalidData as any)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('Validation failed')
    })

    it('testCreate_WithDuplicateProvider_ShouldReturnConflict', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Credential> = {
        data: undefined,
        status: 409,
        error: 'Credential for this provider already exists'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create(assistantId, mockCreateData)

      // Assert
      expect(result.status).toBe(409)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Credential for this provider already exists')
    })

    it('testCreate_WithInvalidApiKey_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const invalidData = { ...mockCreateData, api_key: 'invalid-key-format' }
      const expectedResponse: ApiResponse<Credential> = {
        data: undefined,
        status: 400,
        error: 'Invalid API key format'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create(assistantId, invalidData)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid API key format')
    })

    it('testCreate_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Credential> = {
        data: undefined,
        status: 500,
        error: 'Internal server error'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create(assistantId, mockCreateData)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Internal server error')
    })

    it('testCreate_WithNetworkError_ShouldHandleGracefully', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      mockApiCall.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(credentialAPI.create(assistantId, mockCreateData)).rejects.toThrow('Network error')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('testApiCall_WithTimeout_ShouldHandleGracefully', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Request timeout'))

      // Act & Assert
      await expect(credentialAPI.list('assistant-123')).rejects.toThrow('Request timeout')
    })

    it('testApiCall_WithMalformedResponse_ShouldHandleGracefully', async () => {
      // Arrange
      const malformedResponse = {
        data: 'invalid-json',
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(malformedResponse)

      // Act
      const result = await credentialAPI.list('assistant-123')

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toBe('invalid-json')
    })

    it('testApiCall_WithUnauthorizedAccess_ShouldReturn401', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Credential[]> = {
        data: undefined,
        status: 401,
        error: 'Unauthorized access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.list('assistant-123')

      // Assert
      expect(result.status).toBe(401)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Unauthorized access')
    })

    it('testApiCall_WithForbiddenAccess_ShouldReturn403', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Credential> = {
        data: undefined,
        status: 403,
        error: 'Forbidden access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create('assistant-123', mockCreateData)

      // Assert
      expect(result.status).toBe(403)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Forbidden access')
    })
  })

  describe('Boundary Value Tests', () => {
    it('testCreate_WithMinimalValidData_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const minimalData = {
        provider: 'a', // Minimum length
        api_key: 'sk-test'
      }
      const expectedResponse: ApiResponse<Credential> = {
        data: { ...mockCredential, ...minimalData },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create(assistantId, minimalData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testCreate_WithMaximumValidData_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const maxData = {
        provider: 'a'.repeat(255), // Maximum length
        api_key: 'sk-' + 'a'.repeat(200), // Long API key
        metadata: {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3'
        }
      }
      const expectedResponse: ApiResponse<Credential> = {
        data: { ...mockCredential, ...maxData },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create(assistantId, maxData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testCreate_WithEmptyMetadata_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const dataWithEmptyMetadata = {
        provider: 'openai',
        api_key: 'sk-test-key',
        metadata: {}
      }
      const expectedResponse: ApiResponse<Credential> = {
        data: { ...mockCredential, metadata: {} },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create(assistantId, dataWithEmptyMetadata)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testCreate_WithUndefinedMetadata_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const dataWithoutMetadata = {
        provider: 'openai',
        api_key: 'sk-test-key'
      }
      const expectedResponse: ApiResponse<Credential> = {
        data: mockCredential,
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.create(assistantId, dataWithoutMetadata)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })
  })

  describe('Data Validation Tests', () => {
    it('testCreate_WithValidProviderNames_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const validProviders = ['openai', 'anthropic', 'google', 'azure', 'aws']
      
      for (const provider of validProviders) {
        const data = {
          provider,
          api_key: `sk-${provider}-test-key`
        }
        const expectedResponse: ApiResponse<Credential> = {
          data: { ...mockCredential, provider },
          status: 201,
          error: undefined
        }
        mockApiCall.mockResolvedValue(expectedResponse)

        // Act
        const result = await credentialAPI.create(assistantId, data)

        // Assert
        expect(result.status).toBe(201)
        expect(result.data).not.toBeNull()
      }
    })

    it('testList_WithManyCredentials_ShouldHandleGracefully', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const manyCredentials = Array.from({ length: 50 }, (_, i) => ({
        ...mockCredential,
        provider: `provider-${i}`,
        api_key: `sk-key-${i}`
      }))
      const expectedResponse: ApiResponse<Credential[]> = {
        data: manyCredentials,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await credentialAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toHaveLength(50)
    })
  })
})
