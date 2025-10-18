/**
 * Comprehensive test suite for PromptAPI
 * Following TestNG-style patterns adapted for Jest
 * Tests cover Controller → Service → Repository → DB flow simulation
 */

import { PromptAPI } from '../prompt-api'
import { BaseClient } from '../../lib/base-client'
import { ApiResponse } from '../../types'
import { Prompt } from '../../types/prompt'
import { PromptTypeSchema, UpdatePromptSchema } from '../../schemas/prompt'

describe('PromptAPI Integration Tests', () => {
  let promptAPI: PromptAPI
  let mockApiCall: jest.MockedFunction<any>
  const baseUrl = 'https://api.imchat.ai/'
  const clientApiKey = 'test-client-key'
  const serverApiKey = 'test-server-key'

  // Test data fixtures
  const mockPrompt: Prompt = {
    type: 'rag_system',
    body: 'You are a helpful assistant that answers questions based on the provided context.',
    updated_at: '2024-01-01T00:00:00.000Z'
  }

  const mockPrompts = [
    mockPrompt,
    {
      type: 'memory_summary',
      body: 'Summarize the key points from our conversation.',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      type: 'title',
      body: 'Generate a concise title for this conversation.',
      updated_at: '2024-01-01T00:00:00.000Z'
    },
    {
      type: 'tool_instructions',
      body: 'Use the available tools to help answer user questions.',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ]

  const mockUpdateData = {
    type: 'rag_system' as const,
    body: 'Updated prompt body with new instructions.'
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Create PromptAPI instance
    promptAPI = new PromptAPI(baseUrl, clientApiKey, serverApiKey)
    
    // Mock the apiCall method
    mockApiCall = jest.fn();
    (promptAPI as any).apiCall = mockApiCall
  })

  describe('Constructor and Middleware Setup', () => {
    it('testConstructor_WithValidParams_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new PromptAPI(baseUrl, clientApiKey, serverApiKey)

      // Assert
      expect(api).toBeInstanceOf(PromptAPI)
    })

    it('testConstructor_WithOptionalServerKey_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new PromptAPI(baseUrl, clientApiKey)

      // Assert
      expect(api).toBeInstanceOf(PromptAPI)
    })
  })

  describe('Get Prompt Tests', () => {
    it('testGet_HappyPath_ShouldReturnPrompt', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const expectedResponse: ApiResponse<Prompt> = {
        data: mockPrompt,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.get(assistantId, promptType)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockPrompt)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/prompts/${promptType}`,
        { assistantId, promptType },
        {},
        expect.any(Array)
      )
    })

    it('testGet_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const expectedResponse: ApiResponse<Prompt> = {
        data: undefined,
        status: 404,
        error: 'Prompt not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.get(assistantId, promptType)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Prompt not found')
    })

    it('testGet_WithInvalidPromptType_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'invalid_type' as any
      const expectedResponse: ApiResponse<Prompt> = {
        data: undefined,
        status: 400,
        error: 'Invalid prompt type'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.get(assistantId, promptType)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid prompt type')
    })

    it('testGet_WithEmptyAssistantId_ShouldHandleValidation', async () => {
      // Arrange
      const assistantId = ''
      const promptType = 'rag_system'
      const expectedResponse: ApiResponse<Prompt> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.get(assistantId, promptType)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID')
    })
  })

  describe('Update Prompt Tests', () => {
    it('testUpdate_HappyPath_ShouldReturnUpdatedPrompt', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const body = 'Updated prompt body'
      const updatedPrompt = { ...mockPrompt, body }
      const expectedResponse: ApiResponse<Prompt> = {
        data: updatedPrompt,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, body)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(updatedPrompt)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/prompts/${promptType}`,
        { assistantId, promptType, body },
        { method: 'PUT' },
        expect.any(Array)
      )
    })

    it('testUpdate_WithValidationError_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const body = '' // Empty body
      const expectedResponse: ApiResponse<Prompt> = {
        data: undefined,
        status: 400,
        error: 'Validation failed: body cannot be empty'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, body)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('Validation failed')
    })

    it('testUpdate_WithInvalidPromptType_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'invalid_type' as any
      const body = 'Valid body'
      const expectedResponse: ApiResponse<Prompt> = {
        data: undefined,
        status: 400,
        error: 'Invalid prompt type'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, body)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid prompt type')
    })

    it('testUpdate_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'non-existent-assistant'
      const promptType = 'rag_system'
      const body = 'Updated body'
      const expectedResponse: ApiResponse<Prompt> = {
        data: undefined,
        status: 404,
        error: 'Assistant not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, body)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Assistant not found')
    })

    it('testUpdate_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const body = 'Updated body'
      const expectedResponse: ApiResponse<Prompt> = {
        data: undefined,
        status: 500,
        error: 'Internal server error'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, body)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Internal server error')
    })

    it('testUpdate_WithNetworkError_ShouldHandleGracefully', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const body = 'Updated body'
      mockApiCall.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(promptAPI.update(assistantId, promptType, body)).rejects.toThrow('Network error')
    })
  })

  describe('Delete Prompt Tests', () => {
    it('testDelete_HappyPath_ShouldReturnSuccess', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 204,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.delete(assistantId, promptType)

      // Assert
      expect(result.status).toBe(204)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/prompts/${promptType}`,
        { assistantId, promptType },
        { method: 'DELETE' },
        expect.any(Array)
      )
    })

    it('testDelete_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 404,
        error: 'Prompt not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.delete(assistantId, promptType)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Prompt not found')
    })

    it('testDelete_WithInvalidPromptType_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'invalid_type' as any
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 400,
        error: 'Invalid prompt type'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.delete(assistantId, promptType)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid prompt type')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('testApiCall_WithTimeout_ShouldHandleGracefully', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Request timeout'))

      // Act & Assert
      await expect(promptAPI.get('assistant-123', 'rag_system')).rejects.toThrow('Request timeout')
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
      const result = await promptAPI.get('assistant-123', 'rag_system')

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toBe('invalid-json')
    })

    it('testApiCall_WithUnauthorizedAccess_ShouldReturn401', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Prompt> = {
        data: undefined,
        status: 401,
        error: 'Unauthorized access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.get('assistant-123', 'rag_system')

      // Assert
      expect(result.status).toBe(401)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Unauthorized access')
    })

    it('testApiCall_WithForbiddenAccess_ShouldReturn403', async () => {
      // Arrange
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 403,
        error: 'Forbidden access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.delete('assistant-123', 'rag_system')

      // Assert
      expect(result.status).toBe(403)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Forbidden access')
    })
  })

  describe('Boundary Value Tests', () => {
    it('testUpdate_WithMinimalValidBody_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const body = 'a' // Minimum length
      const expectedResponse: ApiResponse<Prompt> = {
        data: { ...mockPrompt, body },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, body)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })

    it('testUpdate_WithMaximumValidBody_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const body = 'A'.repeat(10000) // Large body
      const expectedResponse: ApiResponse<Prompt> = {
        data: { ...mockPrompt, body },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, body)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })

    it('testGet_WithAllValidPromptTypes_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const validTypes = ['rag_system', 'memory_summary', 'title', 'tool_instructions']
      
      for (const promptType of validTypes) {
        const expectedResponse: ApiResponse<Prompt> = {
          data: { ...mockPrompt, type: promptType as any },
          status: 200,
          error: undefined
        }
        mockApiCall.mockResolvedValue(expectedResponse)

        // Act
        const result = await promptAPI.get(assistantId, promptType as any)

        // Assert
        expect(result.status).toBe(200)
        expect(result.data).not.toBeNull()
        expect(result.data?.type).toBe(promptType)
      }
    })

    it('testUpdate_WithSpecialCharactersInBody_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const body = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`'
      const expectedResponse: ApiResponse<Prompt> = {
        data: { ...mockPrompt, body },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, body)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })
  })

  describe('Data Validation Tests', () => {
    it('testUpdate_WithMultilineBody_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'rag_system'
      const multilineBody = `You are a helpful assistant.

Please follow these guidelines:
1. Be helpful and accurate
2. Use the provided context
3. Be concise but thorough

Thank you!`
      const expectedResponse: ApiResponse<Prompt> = {
        data: { ...mockPrompt, body: multilineBody },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, multilineBody)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.body).toBe(multilineBody)
    })

    it('testUpdate_WithJsonInBody_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'tool_instructions'
      const jsonBody = `{
        "instructions": "Use tools when needed",
        "format": "json",
        "examples": ["example1", "example2"]
      }`
      const expectedResponse: ApiResponse<Prompt> = {
        data: { ...mockPrompt, type: 'tool_instructions', body: jsonBody },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.update(assistantId, promptType, jsonBody)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.body).toBe(jsonBody)
    })

    it('testGet_WithNonExistentPromptType_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const promptType = 'non_existent_type' as any
      const expectedResponse: ApiResponse<Prompt> = {
        data: undefined,
        status: 404,
        error: 'Prompt type not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await promptAPI.get(assistantId, promptType)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Prompt type not found')
    })
  })
})
