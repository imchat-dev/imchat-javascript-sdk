/**
 * Comprehensive test suite for AssistantAPI
 * Following TestNG-style patterns adapted for Jest
 * Tests cover Controller → Service → Repository → DB flow simulation
 */

import { AssistantAPI } from '../assistant-api'
import { BaseClient } from '../../lib/base-client'
import { ApiResponse } from '../../types'
import { Assistant } from '../../types/assistant'
import { CreateAssistantSchema, UpdateAssistantSchema } from '../../schemas'
import { MiddlewarePipeline } from '../../lib/middleware'

describe('AssistantAPI Integration Tests', () => {
  let assistantAPI: AssistantAPI
  let mockApiCall: jest.MockedFunction<any>
  const baseUrl = 'https://api.imchat.ai/'
  const clientApiKey = 'test-client-key'
  const serverApiKey = 'test-server-key'

  // Test data fixtures
  const mockAssistant: Assistant = {
    id: 'assistant-123',
    name: 'Test Assistant',
    description: 'A test assistant for unit testing',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    top_p: 0.9,
    max_output_tokens: 1000,
    embedding_provider: 'openai',
    embedding_model: 'text-embedding-ada-002',
    embedding_dimension: 1536,
    retrieval_config: { top_k: 5 },
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }

  const mockCreateData = {
    name: 'Test Assistant',
    description: 'A test assistant for unit testing',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    top_p: 0.9,
    max_output_tokens: 1000,
    embedding_provider: 'openai',
    embedding_model: 'text-embedding-ada-002',
    embedding_dimension: 1536,
    retrieval_config: { top_k: 5 }
  }

  const mockUpdateData = {
    name: 'Updated Assistant',
    temperature: 0.8
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Create AssistantAPI instance
    assistantAPI = new AssistantAPI(baseUrl, clientApiKey, serverApiKey)
    
    // Mock the apiCall method
    mockApiCall = jest.fn();
    (assistantAPI as any).apiCall = mockApiCall
  })


  describe('Constructor and Middleware Setup', () => {
    it('testConstructor_WithValidParams_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new AssistantAPI(baseUrl, clientApiKey, serverApiKey)

      // Assert
      expect(api).toBeInstanceOf(AssistantAPI)
    })

    it('testConstructor_WithOptionalServerKey_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new AssistantAPI(baseUrl, clientApiKey)

      // Assert
      expect(api).toBeInstanceOf(AssistantAPI)
    })
  })

  describe('Create Assistant Tests', () => {
    it('testCreate_HappyPath_ShouldReturnSuccessResponse', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Assistant> = {
        data: mockAssistant,
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.create(mockCreateData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockAssistant)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        '/api/assistants',
        mockCreateData,
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testCreate_WithValidationError_ShouldReturnValidationError', async () => {
      // Arrange
      const invalidData = { name: '', provider: 'invalid' }
      const expectedResponse: ApiResponse<Assistant> = {
        data: undefined,
        status: 400,
        error: 'Validation failed: name is required'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.create(invalidData as any)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('Validation failed')
    })

    it('testCreate_WithServerError_ShouldReturnErrorResponse', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Assistant> = {
        data: undefined,
        status: 500,
        error: 'Internal server error'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.create(mockCreateData)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Internal server error')
    })

    it('testCreate_WithNetworkError_ShouldHandleGracefully', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(assistantAPI.create(mockCreateData)).rejects.toThrow('Network error')
    })
  })

  describe('Get Assistant Tests', () => {
    it('testGet_HappyPath_ShouldReturnAssistant', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Assistant> = {
        data: mockAssistant,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.get(assistantId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockAssistant)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(`/api/assistants/${assistantId}`)
    })

    it('testGet_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'non-existent-id'
      const expectedResponse: ApiResponse<Assistant> = {
        data: undefined,
        status: 404,
        error: 'Assistant not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.get(assistantId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Assistant not found')
    })

    it('testGet_WithEmptyId_ShouldHandleValidation', async () => {
      // Arrange
      const assistantId = ''
      const expectedResponse: ApiResponse<Assistant> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.get(assistantId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID')
    })
  })

  describe('List Assistants Tests', () => {
    it('testList_HappyPath_ShouldReturnAssistantArray', async () => {
      // Arrange
      const mockAssistants = [mockAssistant, { ...mockAssistant, id: 'assistant-456' }]
      const expectedResponse: ApiResponse<Assistant[]> = {
        data: mockAssistants,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.list()

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith('/api/assistants')
    })

    it('testList_WithEmptyList_ShouldReturnEmptyArray', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Assistant[]> = {
        data: [],
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.list()

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(0)
      expect(result.error).toBeUndefined()
    })

    it('testList_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Assistant[]> = {
        data: undefined,
        status: 500,
        error: 'Database connection failed'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.list()

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('Update Assistant Tests', () => {
    it('testUpdate_HappyPath_ShouldReturnUpdatedAssistant', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const updatedAssistant = { ...mockAssistant, ...mockUpdateData }
      const expectedResponse: ApiResponse<Assistant> = {
        data: updatedAssistant,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.update(assistantId, mockUpdateData)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(updatedAssistant)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}`,
        { assistantId, data: mockUpdateData },
        { method: 'PUT' },
        expect.any(Array)
      )
    })

    it('testUpdate_WithValidationError_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const invalidData = { temperature: 2.0 } // Invalid temperature > 1
      const expectedResponse: ApiResponse<Assistant> = {
        data: undefined,
        status: 400,
        error: 'Validation failed: temperature must be between 0 and 1'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.update(assistantId, invalidData as any)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('Validation failed')
    })

    it('testUpdate_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'non-existent-id'
      const expectedResponse: ApiResponse<Assistant> = {
        data: undefined,
        status: 404,
        error: 'Assistant not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.update(assistantId, mockUpdateData)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Assistant not found')
    })
  })

  describe('Delete Assistant Tests', () => {
    it('testDelete_HappyPath_ShouldReturnSuccess', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 204,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.delete(assistantId)

      // Assert
      expect(result.status).toBe(204)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}`,
        assistantId,
        { method: 'DELETE' },
        expect.any(Array)
      )
    })

    it('testDelete_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'non-existent-id'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 404,
        error: 'Assistant not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.delete(assistantId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Assistant not found')
    })

    it('testDelete_WithEmptyId_ShouldHandleValidation', async () => {
      // Arrange
      const assistantId = ''
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.delete(assistantId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID')
    })
  })

  describe('Reindex Assistant Tests', () => {
    it('testReindex_HappyPath_ShouldReturnSuccess', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sources = ['source1', 'source2']
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.reindex(assistantId, sources)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/reindex`,
        { sources },
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testReindex_WithEmptySources_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sources: string[] = []
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 400,
        error: 'Validation failed: sources array cannot be empty'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.reindex(assistantId, sources)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('Validation failed')
    })

    it('testReindex_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'non-existent-id'
      const sources = ['source1']
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 404,
        error: 'Assistant not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.reindex(assistantId, sources)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Assistant not found')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('testApiCall_WithTimeout_ShouldHandleGracefully', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Request timeout'))

      // Act & Assert
      await expect(assistantAPI.get('assistant-123')).rejects.toThrow('Request timeout')
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
      const result = await assistantAPI.get('assistant-123')

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toBe('invalid-json')
    })

    it('testApiCall_WithNetworkFailure_ShouldReturnError', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Network failure'))

      // Act & Assert
      await expect(assistantAPI.create(mockCreateData)).rejects.toThrow('Network failure')
    })

    it('testApiCall_WithUnauthorizedAccess_ShouldReturn401', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Assistant> = {
        data: undefined,
        status: 401,
        error: 'Unauthorized access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.get('assistant-123')

      // Assert
      expect(result.status).toBe(401)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Unauthorized access')
    })

    it('testApiCall_WithForbiddenAccess_ShouldReturn403', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Assistant> = {
        data: undefined,
        status: 403,
        error: 'Forbidden access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.delete('assistant-123')

      // Assert
      expect(result.status).toBe(403)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Forbidden access')
    })
  })

  describe('Boundary Value Tests', () => {
    it('testCreate_WithMinimalValidData_ShouldSucceed', async () => {
      // Arrange
      const minimalData = {
        name: 'A', // Minimum length
        provider: 'openai',
        model: 'gpt-4'
      }
      const expectedResponse: ApiResponse<Assistant> = {
        data: { ...mockAssistant, ...minimalData },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.create(minimalData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testCreate_WithMaximumValidData_ShouldSucceed', async () => {
      // Arrange
      const maxData = {
        name: 'A'.repeat(255), // Maximum length
        description: 'A'.repeat(1000), // Maximum length
        provider: 'openai',
        model: 'gpt-4',
        temperature: 1.0, // Maximum value
        top_p: 1.0, // Maximum value
        max_output_tokens: 1000000, // Large number
        embedding_provider: 'openai',
        embedding_model: 'text-embedding-ada-002',
        embedding_dimension: 10000
      }
      const expectedResponse: ApiResponse<Assistant> = {
        data: { ...mockAssistant, ...maxData },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.create(maxData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testUpdate_WithPartialData_ShouldSucceed', async () => {
      // Arrange
      const partialData = { name: 'Updated Name' }
      const expectedResponse: ApiResponse<Assistant> = {
        data: { ...mockAssistant, ...partialData },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await assistantAPI.update('assistant-123', partialData)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })
  })
})
