/**
 * Comprehensive test suite for ChatAPI
 * Following TestNG-style patterns adapted for Jest
 * Tests cover Controller → Service → Repository → DB flow simulation
 */

import { ChatAPI } from '../chat-api'
import { BaseClient } from '../../lib/base-client'
import { ApiResponse } from '../../types'
import { ChatRequest, ChatResponse } from '../../types/chat'
import { ChatRequestSchema } from '../../schemas/chat'

describe('ChatAPI Integration Tests', () => {
  let chatAPI: ChatAPI
  let mockApiCall: jest.MockedFunction<any>
  const baseUrl = 'https://api.imchat.ai/'
  const clientApiKey = 'test-client-key'
  const serverApiKey = 'test-server-key'

  // Test data fixtures
  const mockChatRequest: ChatRequest = {
    session_id: 'session-123',
    question: 'What is the weather like today?',
    model_override: 'gpt-4',
    temperature_override: 0.7
  }

  const mockChatResponse: ChatResponse = {
    answer: 'I cannot provide real-time weather information as I don\'t have access to current weather data. However, I can help you find weather information by suggesting you check a reliable weather service or website.',
    assistant_id: 'assistant-123',
    session_id: 'session-123',
    model: 'gpt-4',
    provider: 'openai',
    message_id: 'message-456',
    tool_calls: [
      {
        name: 'get_weather',
        arguments: { location: 'current' },
        result: { temperature: 22, condition: 'sunny' },
        execution_time_ms: 1500
      }
    ],
    metadata: {
      tokens_used: 150
    }
  }

  const mockSimpleRequest = {
    question: 'Hello, how are you?'
  }

  const mockRequestWithSession = {
    session_id: 'session-123',
    question: 'Continue our conversation'
  }

  const mockRequestWithOverrides = {
    question: 'Tell me a joke',
    model_override: 'gpt-3.5-turbo',
    temperature_override: 0.9
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Create ChatAPI instance
    chatAPI = new ChatAPI(baseUrl, clientApiKey, serverApiKey)
    
    // Mock the apiCall method
    mockApiCall = jest.fn();
    (chatAPI as any).apiCall = mockApiCall
  })

  describe('Constructor and Middleware Setup', () => {
    it('testConstructor_WithValidParams_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new ChatAPI(baseUrl, clientApiKey, serverApiKey)

      // Assert
      expect(api).toBeInstanceOf(ChatAPI)
    })

    it('testConstructor_WithOptionalServerKey_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new ChatAPI(baseUrl, clientApiKey)

      // Assert
      expect(api).toBeInstanceOf(ChatAPI)
    })
  })

  describe('Send Chat Tests', () => {
    it('testSend_HappyPath_ShouldReturnChatResponse', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: mockChatResponse,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, mockChatRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockChatResponse)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/chat`,
        { assistantId, data: mockChatRequest },
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testSend_WithSimpleRequest_ShouldReturnChatResponse', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const simpleResponse = { ...mockChatResponse, answer: 'Hello! I am doing well, thank you for asking.' }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: simpleResponse,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, mockSimpleRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.answer).toBe('Hello! I am doing well, thank you for asking.')
      expect(result.error).toBeUndefined()
    })

    it('testSend_WithSessionId_ShouldReturnChatResponse', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionResponse = { ...mockChatResponse, answer: 'Continuing our conversation...' }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: sessionResponse,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, mockRequestWithSession)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.answer).toBe('Continuing our conversation...')
      expect(result.error).toBeUndefined()
    })

    it('testSend_WithModelOverrides_ShouldReturnChatResponse', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const overrideResponse = { 
        ...mockChatResponse, 
        model: 'gpt-3.5-turbo',
        answer: 'Why don\'t scientists trust atoms? Because they make up everything!'
      }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: overrideResponse,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, mockRequestWithOverrides)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.model).toBe('gpt-3.5-turbo')
      expect(result.data?.answer).toContain('atoms')
      expect(result.error).toBeUndefined()
    })

    it('testSend_WithValidationError_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const invalidRequest = { question: '' } // Empty question
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: undefined,
        status: 400,
        error: 'Validation failed: question is required'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, invalidRequest as any)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('Validation failed')
    })

    it('testSend_WithInvalidAssistantId_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'non-existent-assistant'
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: undefined,
        status: 404,
        error: 'Assistant not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, mockSimpleRequest)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Assistant not found')
    })

    it('testSend_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: undefined,
        status: 500,
        error: 'Internal server error'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, mockSimpleRequest)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Internal server error')
    })

    it('testSend_WithNetworkError_ShouldHandleGracefully', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      mockApiCall.mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(chatAPI.send(assistantId, mockSimpleRequest)).rejects.toThrow('Network error')
    })
  })

  describe('Send Legacy Chat Tests', () => {
    it('testSendLegacy_HappyPath_ShouldReturnChatResponse', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: mockChatResponse,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.sendLegacy(assistantId, mockChatRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockChatResponse)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/chat/${assistantId}`,
        { assistantId, data: mockChatRequest },
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testSendLegacy_WithSimpleRequest_ShouldReturnChatResponse', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const simpleResponse = { ...mockChatResponse, answer: 'Legacy response' }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: simpleResponse,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.sendLegacy(assistantId, mockSimpleRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.answer).toBe('Legacy response')
      expect(result.error).toBeUndefined()
    })

    it('testSendLegacy_WithValidationError_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const invalidRequest = { question: '' }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: undefined,
        status: 400,
        error: 'Validation failed: question is required'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.sendLegacy(assistantId, invalidRequest as any)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('Validation failed')
    })

    it('testSendLegacy_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: undefined,
        status: 500,
        error: 'Legacy endpoint error'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.sendLegacy(assistantId, mockSimpleRequest)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Legacy endpoint error')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('testApiCall_WithTimeout_ShouldHandleGracefully', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Request timeout'))

      // Act & Assert
      await expect(chatAPI.send('assistant-123', mockSimpleRequest)).rejects.toThrow('Request timeout')
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
      const result = await chatAPI.send('assistant-123', mockSimpleRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toBe('invalid-json')
    })

    it('testApiCall_WithUnauthorizedAccess_ShouldReturn401', async () => {
      // Arrange
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: undefined,
        status: 401,
        error: 'Unauthorized access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send('assistant-123', mockSimpleRequest)

      // Assert
      expect(result.status).toBe(401)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Unauthorized access')
    })

    it('testApiCall_WithForbiddenAccess_ShouldReturn403', async () => {
      // Arrange
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: undefined,
        status: 403,
        error: 'Forbidden access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send('assistant-123', mockSimpleRequest)

      // Assert
      expect(result.status).toBe(403)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Forbidden access')
    })

    it('testApiCall_WithRateLimit_ShouldReturn429', async () => {
      // Arrange
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: undefined,
        status: 429,
        error: 'Rate limit exceeded'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send('assistant-123', mockSimpleRequest)

      // Assert
      expect(result.status).toBe(429)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Rate limit exceeded')
    })
  })

  describe('Boundary Value Tests', () => {
    it('testSend_WithMinimalValidRequest_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const minimalRequest = { question: 'a' } // Minimum length
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: { ...mockChatResponse, answer: 'Minimal response' },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, minimalRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })

    it('testSend_WithMaximumValidRequest_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const maxRequest = {
        question: 'A'.repeat(10000), // Large question
        session_id: 'session-' + 'a'.repeat(200), // Long session ID
        model_override: 'a'.repeat(255), // Maximum model name length
        temperature_override: 1.0 // Maximum temperature
      }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: { ...mockChatResponse, answer: 'Response to large question' },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, maxRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })

    it('testSend_WithTemperatureBoundaries_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const temperatures = [0.0, 0.5, 1.0] // Min, middle, max
      
      for (const temperature of temperatures) {
        const request = {
          question: `Test with temperature ${temperature}`,
          temperature_override: temperature
        }
        const expectedResponse: ApiResponse<ChatResponse> = {
          data: { ...mockChatResponse, answer: `Response with temp ${temperature}` },
          status: 200,
          error: undefined
        }
        mockApiCall.mockResolvedValue(expectedResponse)

        // Act
        const result = await chatAPI.send(assistantId, request)

        // Assert
        expect(result.status).toBe(200)
        expect(result.data).not.toBeNull()
      }
    })

    it('testSend_WithToolCalls_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const requestWithTools = {
        question: 'What is the weather and calculate 2+2?',
        session_id: 'session-123'
      }
      const responseWithTools = {
        ...mockChatResponse,
        answer: 'The weather is sunny and 2+2 equals 4.',
        tool_calls: [
          {
            name: 'get_weather',
            arguments: { location: 'current' },
            result: { temperature: 25, condition: 'sunny' },
            execution_time_ms: 1200
          },
          {
            name: 'calculate',
            arguments: { expression: '2+2' },
            result: 4,
            execution_time_ms: 300
          }
        ],
        metadata: {
          tokens_used: 200
        }
      }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: responseWithTools,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, requestWithTools)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.tool_calls).toHaveLength(2)
      expect(result.data?.tool_calls?.[0].name).toBe('get_weather')
      expect(result.data?.tool_calls?.[1].name).toBe('calculate')
    })
  })

  describe('Data Validation Tests', () => {
    it('testSend_WithSpecialCharactersInQuestion_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const specialRequest = {
        question: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~` and unicode: 🚀🌟💡'
      }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: { ...mockChatResponse, answer: 'Handled special characters' },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, specialRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })

    it('testSend_WithMultilineQuestion_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const multilineRequest = {
        question: `This is a multiline question.
        
It has multiple paragraphs and line breaks.

Please respond appropriately.`
      }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: { ...mockChatResponse, answer: 'Multiline response' },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, multilineRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })

    it('testSend_WithEmptyOptionalFields_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const requestWithEmptyOptionals = {
        question: 'Test question',
        session_id: undefined,
        model_override: undefined,
        temperature_override: undefined
      }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: { ...mockChatResponse, answer: 'Response with empty optionals' },
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, requestWithEmptyOptionals)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })

    it('testSend_WithLongResponse_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const longResponse = {
        ...mockChatResponse,
        answer: 'A'.repeat(50000), // Very long response
        metadata: {
          tokens_used: 10000
        }
      }
      const expectedResponse: ApiResponse<ChatResponse> = {
        data: longResponse,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await chatAPI.send(assistantId, mockSimpleRequest)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.answer).toHaveLength(50000)
      expect(result.data?.metadata?.tokens_used).toBe(10000)
    })
  })
})
