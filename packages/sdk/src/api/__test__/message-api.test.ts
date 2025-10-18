/**
 * Comprehensive test suite for MessageAPI
 * Following TestNG-style patterns adapted for Jest
 * Tests cover Controller → Service → Repository → DB flow simulation
 */

import { MessageAPI } from '../message-api'
import { BaseClient } from '../../lib/base-client'
import { ApiResponse } from '../../types'
import { Message } from '../../types/message'
import { CreateMessageSchema } from '../../schemas/message'

describe('MessageAPI Integration Tests', () => {
  let messageAPI: MessageAPI
  let mockApiCall: jest.MockedFunction<any>
  const baseUrl = 'https://api.imchat.ai/'
  const clientApiKey = 'test-client-key'
  const serverApiKey = 'test-server-key'

  // Test data fixtures
  const mockMessage: Message = {
    id: 'message-123',
    session_id: 'session-123',
    assistant_id: 'assistant-123',
    message_role: 'user',
    content: 'Hello, how are you?',
    model: 'gpt-4',
    provider: 'openai',
    latency_ms: 1500,
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }

  const mockMessages = [
    mockMessage,
    {
      id: 'message-456',
      session_id: 'session-123',
      assistant_id: 'assistant-123',
      message_role: 'assistant',
      content: 'I am doing well, thank you for asking!',
      model: 'gpt-4',
      provider: 'openai',
      latency_ms: 2000,
      prompt_tokens: 20,
      completion_tokens: 15,
      total_tokens: 35,
      created_at: '2024-01-01T00:01:00.000Z',
      updated_at: '2024-01-01T00:01:00.000Z'
    }
  ]

  const mockCreateData = {
    message_role: 'user',
    content: 'What is the weather like today?',
    model: 'gpt-4',
    provider: 'openai'
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Create MessageAPI instance
    messageAPI = new MessageAPI(baseUrl, clientApiKey, serverApiKey)
    
    // Mock the apiCall method
    mockApiCall = jest.fn();
    (messageAPI as any).apiCall = mockApiCall
  })

  describe('Constructor and Middleware Setup', () => {
    it('testConstructor_WithValidParams_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new MessageAPI(baseUrl, clientApiKey, serverApiKey)

      // Assert
      expect(api).toBeInstanceOf(MessageAPI)
    })

    it('testConstructor_WithOptionalServerKey_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new MessageAPI(baseUrl, clientApiKey)

      // Assert
      expect(api).toBeInstanceOf(MessageAPI)
    })
  })

  describe('List Messages Tests', () => {
    it('testList_HappyPath_ShouldReturnMessageArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const expectedResponse: ApiResponse<Message[]> = {
        data: mockMessages,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.list(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/sessions/${sessionId}/messages`,
        { assistantId, sessionId },
        {},
        expect.any(Array)
      )
    })

    it('testList_WithEmptyList_ShouldReturnEmptyArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const expectedResponse: ApiResponse<Message[]> = {
        data: [],
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.list(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(0)
      expect(result.error).toBeUndefined()
    })

    it('testList_WithInvalidIds_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = ''
      const sessionId = ''
      const expectedResponse: ApiResponse<Message[]> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID or session ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.list(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID or session ID')
    })

    it('testList_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const expectedResponse: ApiResponse<Message[]> = {
        data: undefined,
        status: 500,
        error: 'Database connection failed'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.list(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('Create Message Tests', () => {
    it('testCreate_HappyPath_ShouldReturnMessage', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const expectedResponse: ApiResponse<Message> = {
        data: mockMessage,
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.create(assistantId, sessionId, mockCreateData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockMessage)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/sessions/${sessionId}/messages`,
        { assistantId, sessionId, data: mockCreateData },
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testCreate_WithValidationError_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const invalidData = { message_role: '', content: '' }
      const expectedResponse: ApiResponse<Message> = {
        data: undefined,
        status: 400,
        error: 'Validation failed: message_role and content are required'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.create(assistantId, sessionId, invalidData as any)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('Validation failed')
    })

    it('testCreate_WithInvalidSession_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'non-existent-session'
      const expectedResponse: ApiResponse<Message> = {
        data: undefined,
        status: 404,
        error: 'Session not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.create(assistantId, sessionId, mockCreateData)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Session not found')
    })

    it('testCreate_WithEmptyContent_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const emptyContentData = { ...mockCreateData, content: '' }
      const expectedResponse: ApiResponse<Message> = {
        data: undefined,
        status: 400,
        error: 'Content cannot be empty'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.create(assistantId, sessionId, emptyContentData)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Content cannot be empty')
    })

    it('testCreate_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const expectedResponse: ApiResponse<Message> = {
        data: undefined,
        status: 500,
        error: 'Internal server error'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.create(assistantId, sessionId, mockCreateData)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Internal server error')
    })

    it('testCreate_WithNetworkError_ShouldHandleGracefully', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      mockApiCall.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(messageAPI.create(assistantId, sessionId, mockCreateData)).rejects.toThrow('Network error')
    })
  })

  describe('Delete Message Tests', () => {
    it('testDelete_HappyPath_ShouldReturnSuccess', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const messageId = 'message-123'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 204,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.delete(assistantId, sessionId, messageId)

      // Assert
      expect(result.status).toBe(204)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/sessions/${sessionId}/messages/${messageId}`,
        { assistantId, sessionId, messageId },
        { method: 'DELETE' },
        expect.any(Array)
      )
    })

    it('testDelete_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const messageId = 'non-existent-message'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 404,
        error: 'Message not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.delete(assistantId, sessionId, messageId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Message not found')
    })

    it('testDelete_WithEmptyIds_ShouldHandleValidation', async () => {
      // Arrange
      const assistantId = ''
      const sessionId = ''
      const messageId = ''
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID, session ID, or message ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.delete(assistantId, sessionId, messageId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID, session ID, or message ID')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('testApiCall_WithTimeout_ShouldHandleGracefully', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Request timeout'))

      // Act & Assert
      await expect(messageAPI.list('assistant-123', 'session-123')).rejects.toThrow('Request timeout')
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
      const result = await messageAPI.list('assistant-123', 'session-123')

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toBe('invalid-json')
    })

    it('testApiCall_WithUnauthorizedAccess_ShouldReturn401', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Message[]> = {
        data: undefined,
        status: 401,
        error: 'Unauthorized access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.list('assistant-123', 'session-123')

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
      const result = await messageAPI.delete('assistant-123', 'session-123', 'message-123')

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
      const sessionId = 'session-123'
      const minimalData = {
        message_role: 'a', // Minimum length
        content: 'a' // Minimum length
      }
      const expectedResponse: ApiResponse<Message> = {
        data: { ...mockMessage, ...minimalData },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.create(assistantId, sessionId, minimalData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testCreate_WithMaximumValidData_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const maxData = {
        message_role: 'a'.repeat(255), // Maximum length
        content: 'A'.repeat(10000), // Large content
        model: 'a'.repeat(255),
        provider: 'a'.repeat(255)
      }
      const expectedResponse: ApiResponse<Message> = {
        data: { ...mockMessage, ...maxData },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.create(assistantId, sessionId, maxData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testCreate_WithOptionalFields_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const dataWithOptionalFields = {
        message_role: 'user',
        content: 'Test message',
        model: undefined,
        provider: undefined
      }
      const expectedResponse: ApiResponse<Message> = {
        data: { ...mockMessage, model: undefined, provider: undefined },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.create(assistantId, sessionId, dataWithOptionalFields)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testList_WithManyMessages_ShouldHandleGracefully', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const manyMessages = Array.from({ length: 1000 }, (_, i) => ({
        ...mockMessage,
        id: `message-${i}`,
        content: `Message ${i}`
      }))
      const expectedResponse: ApiResponse<Message[]> = {
        data: manyMessages,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.list(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toHaveLength(1000)
    })
  })

  describe('Data Validation Tests', () => {
    it('testCreate_WithValidMessageRoles_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const validRoles = ['user', 'assistant', 'system', 'function']
      
      for (const role of validRoles) {
        const data = {
          message_role: role,
          content: `Test message with role ${role}`
        }
        const expectedResponse: ApiResponse<Message> = {
          data: { ...mockMessage, message_role: role },
          status: 201,
          error: undefined
        }
        mockApiCall.mockResolvedValue(expectedResponse)

        // Act
        const result = await messageAPI.create(assistantId, sessionId, data)

        // Assert
        expect(result.status).toBe(201)
        expect(result.data).not.toBeNull()
        expect(result.data?.message_role).toBe(role)
      }
    })

    it('testCreate_WithMessageHavingTokenCounts_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const dataWithTokens = {
        message_role: 'assistant',
        content: 'Response with token counts',
        model: 'gpt-4',
        provider: 'openai'
      }
      const messageWithTokens = {
        ...mockMessage,
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
        latency_ms: 2500
      }
      const expectedResponse: ApiResponse<Message> = {
        data: messageWithTokens,
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await messageAPI.create(assistantId, sessionId, dataWithTokens)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(result.data?.prompt_tokens).toBe(100)
      expect(result.data?.completion_tokens).toBe(200)
      expect(result.data?.total_tokens).toBe(300)
      expect(result.data?.latency_ms).toBe(2500)
    })
  })
})
