/**
 * Comprehensive test suite for SessionAPI
 * Following TestNG-style patterns adapted for Jest
 * Tests cover Controller → Service → Repository → DB flow simulation
 */

import { SessionAPI } from '../session-api'
import { BaseClient } from '../../lib/base-client'
import { ApiResponse } from '../../types'
import { Session } from '../../types/session'

describe('SessionAPI Integration Tests', () => {
  let sessionAPI: SessionAPI
  let mockApiCall: jest.MockedFunction<any>
  const baseUrl = 'https://api.imchat.ai/'
  const clientApiKey = 'test-client-key'
  const serverApiKey = 'test-server-key'

  // Test data fixtures
  const mockSession: Session = {
    id: 'session-123',
    assistant_id: 'assistant-123',
    title: 'Test Chat Session',
    title_locked: false,
    started_at: '2024-01-01T00:00:00.000Z',
    last_activity_at: '2024-01-01T00:30:00.000Z',
    client_ip: '192.168.1.1',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    updated_at: '2024-01-01T00:30:00.000Z'
  }

  const mockSessions = [
    mockSession,
    {
      id: 'session-456',
      assistant_id: 'assistant-123',
      title: 'Another Chat Session',
      title_locked: true,
      started_at: '2024-01-01T01:00:00.000Z',
      last_activity_at: '2024-01-01T01:15:00.000Z',
      client_ip: '192.168.1.2',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      updated_at: '2024-01-01T01:15:00.000Z'
    }
  ]

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Create SessionAPI instance
    sessionAPI = new SessionAPI(baseUrl, clientApiKey, serverApiKey)
    
    // Mock the apiCall method
    mockApiCall = jest.fn();
    (sessionAPI as any).apiCall = mockApiCall
  })

  describe('Constructor and Middleware Setup', () => {
    it('testConstructor_WithValidParams_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new SessionAPI(baseUrl, clientApiKey, serverApiKey)

      // Assert
      expect(api).toBeInstanceOf(SessionAPI)
    })

    it('testConstructor_WithOptionalServerKey_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new SessionAPI(baseUrl, clientApiKey)

      // Assert
      expect(api).toBeInstanceOf(SessionAPI)
    })
  })

  describe('List Sessions Tests', () => {
    it('testList_HappyPath_ShouldReturnSessionArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Session[]> = {
        data: mockSessions,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/sessions`,
        assistantId,
        {},
        expect.any(Array)
      )
    })

    it('testList_WithEmptyList_ShouldReturnEmptyArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Session[]> = {
        data: [],
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.list(assistantId)

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
      const expectedResponse: ApiResponse<Session[]> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID')
    })

    it('testList_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Session[]> = {
        data: undefined,
        status: 500,
        error: 'Database connection failed'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('Get Session Tests', () => {
    it('testGet_HappyPath_ShouldReturnSession', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const expectedResponse: ApiResponse<Session> = {
        data: mockSession,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.get(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockSession)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/sessions/${sessionId}`,
        { assistantId, sessionId },
        {},
        expect.any(Array)
      )
    })

    it('testGet_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'non-existent-session'
      const expectedResponse: ApiResponse<Session> = {
        data: undefined,
        status: 404,
        error: 'Session not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.get(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Session not found')
    })

    it('testGet_WithEmptyIds_ShouldHandleValidation', async () => {
      // Arrange
      const assistantId = ''
      const sessionId = ''
      const expectedResponse: ApiResponse<Session> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID or session ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.get(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID or session ID')
    })
  })

  describe('Create Session Tests', () => {
    it('testCreate_HappyPath_ShouldReturnSession', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Session> = {
        data: mockSession,
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.create(assistantId)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockSession)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/sessions`,
        assistantId,
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testCreate_WithInvalidAssistantId_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = ''
      const expectedResponse: ApiResponse<Session> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.create(assistantId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID')
    })

    it('testCreate_WithNotFoundAssistant_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'non-existent-assistant'
      const expectedResponse: ApiResponse<Session> = {
        data: undefined,
        status: 404,
        error: 'Assistant not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.create(assistantId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Assistant not found')
    })

    it('testCreate_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Session> = {
        data: undefined,
        status: 500,
        error: 'Internal server error'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.create(assistantId)

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
      await expect(sessionAPI.create(assistantId)).rejects.toThrow('Network error')
    })
  })

  describe('Delete Session Tests', () => {
    it('testDelete_HappyPath_ShouldReturnSuccess', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 204,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.delete(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(204)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/sessions/${sessionId}`,
        { assistantId, sessionId },
        { method: 'DELETE' },
        expect.any(Array)
      )
    })

    it('testDelete_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'non-existent-session'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 404,
        error: 'Session not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.delete(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Session not found')
    })

    it('testDelete_WithEmptyIds_ShouldHandleValidation', async () => {
      // Arrange
      const assistantId = ''
      const sessionId = ''
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID or session ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.delete(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID or session ID')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('testApiCall_WithTimeout_ShouldHandleGracefully', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Request timeout'))

      // Act & Assert
      await expect(sessionAPI.get('assistant-123', 'session-123')).rejects.toThrow('Request timeout')
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
      const result = await sessionAPI.get('assistant-123', 'session-123')

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toBe('invalid-json')
    })

    it('testApiCall_WithUnauthorizedAccess_ShouldReturn401', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Session> = {
        data: undefined,
        status: 401,
        error: 'Unauthorized access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.get('assistant-123', 'session-123')

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
      const result = await sessionAPI.delete('assistant-123', 'session-123')

      // Assert
      expect(result.status).toBe(403)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Forbidden access')
    })
  })

  describe('Boundary Value Tests', () => {
    it('testCreate_WithMinimalValidAssistantId_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'a' // Minimum length
      const expectedResponse: ApiResponse<Session> = {
        data: { ...mockSession, assistant_id: assistantId },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.create(assistantId)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testCreate_WithMaximumValidAssistantId_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'a'.repeat(255) // Maximum length
      const expectedResponse: ApiResponse<Session> = {
        data: { ...mockSession, assistant_id: assistantId },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.create(assistantId)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testList_WithManySessions_ShouldHandleGracefully', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const manySessions = Array.from({ length: 100 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
        title: `Session ${i}`
      }))
      const expectedResponse: ApiResponse<Session[]> = {
        data: manySessions,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toHaveLength(100)
    })

    it('testGet_WithSessionHavingLongTitle_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const sessionWithLongTitle = {
        ...mockSession,
        title: 'A'.repeat(255) // Maximum length
      }
      const expectedResponse: ApiResponse<Session> = {
        data: sessionWithLongTitle,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.get(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.title).toHaveLength(255)
    })
  })

  describe('Data Validation Tests', () => {
    it('testGet_WithSessionHavingOptionalFields_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionId = 'session-123'
      const sessionWithOptionalFields = {
        ...mockSession,
        title: undefined,
        client_ip: undefined,
        user_agent: undefined,
        updated_at: undefined
      }
      const expectedResponse: ApiResponse<Session> = {
        data: sessionWithOptionalFields,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.get(assistantId, sessionId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data?.title).toBeUndefined()
      expect(result.data?.client_ip).toBeUndefined()
      expect(result.data?.user_agent).toBeUndefined()
      expect(result.data?.updated_at).toBeUndefined()
    })

    it('testCreate_WithSessionHavingAllFields_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const sessionWithAllFields = {
        ...mockSession,
        title: 'Complete Session',
        client_ip: '192.168.1.100',
        user_agent: 'Custom User Agent',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
      const expectedResponse: ApiResponse<Session> = {
        data: sessionWithAllFields,
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await sessionAPI.create(assistantId)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(result.data?.title).toBe('Complete Session')
      expect(result.data?.client_ip).toBe('192.168.1.100')
      expect(result.data?.user_agent).toBe('Custom User Agent')
    })
  })
})
