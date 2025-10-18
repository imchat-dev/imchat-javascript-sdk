/**
 * Comprehensive test suite for ToolAPI
 * Following TestNG-style patterns adapted for Jest
 * Tests cover Controller → Service → Repository → DB flow simulation
 */

import { ToolAPI } from '../tool-api'
import { BaseClient } from '../../lib/base-client'
import { ApiResponse } from '../../types'
import { Tool } from '../../types/tool'
import { CreateToolSchema, UpdateToolSchema } from '../../schemas/tool'

describe('ToolAPI Integration Tests', () => {
  let toolAPI: ToolAPI
  let mockApiCall: jest.MockedFunction<any>
  const baseUrl = 'https://api.imchat.ai/'
  const clientApiKey = 'test-client-key'
  const serverApiKey = 'test-server-key'

  // Test data fixtures
  const mockTool: Tool = {
    id: 'tool-123',
    name: 'weather_tool',
    description: 'Get current weather information for a given location',
    definition: {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city and state, e.g. San Francisco, CA'
            }
          },
          required: ['location']
        }
      }
    },
    transport: 'https',
    status: 'active',
    version: '1.0.0',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }

  const mockTools = [
    mockTool,
    {
      id: 'tool-456',
      name: 'calculator_tool',
      description: 'Perform mathematical calculations',
      definition: {
        type: 'function',
        function: {
          name: 'calculate',
          description: 'Calculate mathematical expressions',
          parameters: {
            type: 'object',
            properties: {
              expression: {
                type: 'string',
                description: 'Mathematical expression to evaluate'
              }
            },
            required: ['expression']
          }
        }
      },
      transport: 'mcp' as const,
      status: 'inactive' as const,
      version: '2.0.0',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ]

  const mockCreateData = {
    name: 'new_tool',
    description: 'A new tool for testing',
    definition: {
      type: 'function',
      function: {
        name: 'new_function',
        description: 'New function description',
        parameters: {
          type: 'object',
          properties: {
            param1: {
              type: 'string',
              description: 'First parameter'
            }
          },
          required: ['param1']
        }
      }
    },
    transport: 'https' as const
  }

  const mockUpdateData = {
    name: 'updated_tool',
    description: 'Updated tool description',
    status: 'inactive' as const
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Create ToolAPI instance
    toolAPI = new ToolAPI(baseUrl, clientApiKey, serverApiKey)
    
    // Mock the apiCall method
    mockApiCall = jest.fn();
    (toolAPI as any).apiCall = mockApiCall
  })

  describe('Constructor and Middleware Setup', () => {
    it('testConstructor_WithValidParams_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new ToolAPI(baseUrl, clientApiKey, serverApiKey)

      // Assert
      expect(api).toBeInstanceOf(ToolAPI)
    })

    it('testConstructor_WithOptionalServerKey_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new ToolAPI(baseUrl, clientApiKey)

      // Assert
      expect(api).toBeInstanceOf(ToolAPI)
    })
  })

  describe('List Tools Tests', () => {
    it('testList_HappyPath_ShouldReturnToolArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Tool[]> = {
        data: mockTools,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/tools`,
        assistantId,
        {},
        expect.any(Array)
      )
    })

    it('testList_WithEmptyList_ShouldReturnEmptyArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Tool[]> = {
        data: [],
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.list(assistantId)

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
      const expectedResponse: ApiResponse<Tool[]> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID')
    })

    it('testList_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Tool[]> = {
        data: undefined,
        status: 500,
        error: 'Database connection failed'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(500)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Database connection failed')
    })
  })

  describe('Get Tool Tests', () => {
    it('testGet_HappyPath_ShouldReturnTool', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'tool-123'
      const expectedResponse: ApiResponse<Tool> = {
        data: mockTool,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.get(assistantId, toolId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockTool)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/tools/${toolId}`,
        { assistantId, toolId },
        {},
        expect.any(Array)
      )
    })

    it('testGet_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'non-existent-tool'
      const expectedResponse: ApiResponse<Tool> = {
        data: undefined,
        status: 404,
        error: 'Tool not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.get(assistantId, toolId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Tool not found')
    })

    it('testGet_WithEmptyIds_ShouldHandleValidation', async () => {
      // Arrange
      const assistantId = ''
      const toolId = ''
      const expectedResponse: ApiResponse<Tool> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID or tool ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.get(assistantId, toolId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID or tool ID')
    })
  })

  describe('Create Tool Tests', () => {
    it('testCreate_HappyPath_ShouldReturnTool', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Tool> = {
        data: mockTool,
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.create(assistantId, mockCreateData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockTool)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/tools`,
        { assistantId, data: mockCreateData },
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testCreate_WithValidationError_ShouldReturnValidationError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const invalidData = { name: '', description: '', transport: 'invalid' as any }
      const expectedResponse: ApiResponse<Tool> = {
        data: undefined,
        status: 400,
        error: 'Validation failed: name, description, and transport are required'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.create(assistantId, invalidData as any)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('Validation failed')
    })

    it('testCreate_WithDuplicateName_ShouldReturnConflict', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Tool> = {
        data: undefined,
        status: 409,
        error: 'Tool with this name already exists'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.create(assistantId, mockCreateData)

      // Assert
      expect(result.status).toBe(409)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Tool with this name already exists')
    })

    it('testCreate_WithServerError_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Tool> = {
        data: undefined,
        status: 500,
        error: 'Internal server error'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.create(assistantId, mockCreateData)

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
      await expect(toolAPI.create(assistantId, mockCreateData)).rejects.toThrow('Network error')
    })
  })

  describe('Update Tool Tests', () => {
    it('testUpdate_HappyPath_ShouldReturnUpdatedTool', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'tool-123'
      const updatedTool = { ...mockTool, ...mockUpdateData }
      const expectedResponse: ApiResponse<Tool> = {
        data: updatedTool,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.update(assistantId, toolId, mockUpdateData)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(updatedTool)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/tools/${toolId}`,
        { assistantId, toolId, data: mockUpdateData },
        { method: 'PUT' },
        expect.any(Array)
      )
    })

    it('testUpdate_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'non-existent-tool'
      const expectedResponse: ApiResponse<Tool> = {
        data: undefined,
        status: 404,
        error: 'Tool not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.update(assistantId, toolId, mockUpdateData)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Tool not found')
    })
  })

  describe('Delete Tool Tests', () => {
    it('testDelete_HappyPath_ShouldReturnSuccess', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'tool-123'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 204,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.delete(assistantId, toolId)

      // Assert
      expect(result.status).toBe(204)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/tools/${toolId}`,
        { assistantId, toolId },
        { method: 'DELETE' },
        expect.any(Array)
      )
    })

    it('testDelete_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'non-existent-tool'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 404,
        error: 'Tool not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.delete(assistantId, toolId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Tool not found')
    })
  })

  describe('Get Tool Versions Tests', () => {
    it('testGetVersions_HappyPath_ShouldReturnVersionArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'tool-123'
      const versions = [
        { ...mockTool, version: '1.0.0' },
        { ...mockTool, version: '1.1.0' },
        { ...mockTool, version: '2.0.0' }
      ]
      const expectedResponse: ApiResponse<Tool[]> = {
        data: versions,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.getVersions(assistantId, toolId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/tools/${toolId}/versions`,
        { assistantId, toolId },
        {},
        expect.any(Array)
      )
    })

    it('testGetVersions_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'non-existent-tool'
      const expectedResponse: ApiResponse<Tool[]> = {
        data: undefined,
        status: 404,
        error: 'Tool not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.getVersions(assistantId, toolId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Tool not found')
    })
  })

  describe('Rotate Secret Tests', () => {
    it('testRotateSecret_HappyPath_ShouldReturnNewSecret', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'tool-123'
      const secretResult = {
        new_secret: 'new-secret-key-123',
        expires_at: '2024-12-31T23:59:59.000Z'
      }
      const expectedResponse: ApiResponse<typeof secretResult> = {
        data: secretResult,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.rotateSecret(assistantId, toolId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(secretResult)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/tools/${toolId}/rotate-secret`,
        { assistantId, toolId },
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testRotateSecret_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const toolId = 'non-existent-tool'
      const expectedResponse: ApiResponse<any> = {
        data: undefined,
        status: 404,
        error: 'Tool not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.rotateSecret(assistantId, toolId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Tool not found')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('testApiCall_WithTimeout_ShouldHandleGracefully', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Request timeout'))

      // Act & Assert
      await expect(toolAPI.get('assistant-123', 'tool-123')).rejects.toThrow('Request timeout')
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
      const result = await toolAPI.get('assistant-123', 'tool-123')

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).toBe('invalid-json')
    })

    it('testApiCall_WithUnauthorizedAccess_ShouldReturn401', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Tool> = {
        data: undefined,
        status: 401,
        error: 'Unauthorized access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.get('assistant-123', 'tool-123')

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
      const result = await toolAPI.delete('assistant-123', 'tool-123')

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
        name: 'a', // Minimum length
        description: 'a', // Minimum length
        definition: { type: 'function' },
        transport: 'https' as const
      }
      const expectedResponse: ApiResponse<Tool> = {
        data: { ...mockTool, ...minimalData },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.create(assistantId, minimalData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testCreate_WithMaximumValidData_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const maxData = {
        name: 'a'.repeat(255), // Maximum length
        description: 'A'.repeat(1000), // Maximum length
        definition: {
          type: 'function',
          function: {
            name: 'complex_function',
            description: 'A'.repeat(500),
            parameters: {
              type: 'object',
              properties: {
                param1: { type: 'string', description: 'Parameter 1' },
                param2: { type: 'number', description: 'Parameter 2' },
                param3: { type: 'boolean', description: 'Parameter 3' }
              },
              required: ['param1', 'param2']
            }
          }
        },
        transport: 'mcp' as const
      }
      const expectedResponse: ApiResponse<Tool> = {
        data: { ...mockTool, ...maxData },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.create(assistantId, maxData)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testCreate_WithBothTransportTypes_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const transports = ['https', 'mcp']
      
      for (const transport of transports) {
        const data = {
          ...mockCreateData,
          transport: transport as 'https' | 'mcp'
        }
        const expectedResponse: ApiResponse<Tool> = {
          data: { ...mockTool, transport: transport as 'https' | 'mcp' },
          status: 201,
          error: undefined
        }
        mockApiCall.mockResolvedValue(expectedResponse)

        // Act
        const result = await toolAPI.create(assistantId, data)

        // Assert
        expect(result.status).toBe(201)
        expect(result.data).not.toBeNull()
        expect(result.data?.transport).toBe(transport)
      }
    })

    it('testCreate_WithBothStatusTypes_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const statuses = ['active', 'inactive']
      
      for (const status of statuses) {
        const data = {
          ...mockCreateData,
          status: status as 'active' | 'inactive'
        }
        const expectedResponse: ApiResponse<Tool> = {
          data: { ...mockTool, status: status as 'active' | 'inactive' },
          status: 201,
          error: undefined
        }
        mockApiCall.mockResolvedValue(expectedResponse)

        // Act
        const result = await toolAPI.create(assistantId, data)

        // Assert
        expect(result.status).toBe(201)
        expect(result.data).not.toBeNull()
        expect(result.data?.status).toBe(status)
      }
    })
  })

  describe('Data Validation Tests', () => {
    it('testCreate_WithComplexDefinition_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const complexDefinition = {
        type: 'function',
        function: {
          name: 'complex_analysis',
          description: 'Perform complex data analysis',
          parameters: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    value: { type: 'number' },
                    category: { type: 'string', enum: ['A', 'B', 'C'] }
                  },
                  required: ['id', 'value']
                }
              },
              options: {
                type: 'object',
                properties: {
                  algorithm: { type: 'string', enum: ['linear', 'polynomial', 'exponential'] },
                  threshold: { type: 'number', minimum: 0, maximum: 1 },
                  includeMetadata: { type: 'boolean' }
                },
                required: ['algorithm']
              }
            },
            required: ['data']
          }
        }
      }
      const data = {
        ...mockCreateData,
        definition: complexDefinition
      }
      const expectedResponse: ApiResponse<Tool> = {
        data: { ...mockTool, definition: complexDefinition },
        status: 201,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.create(assistantId, data)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(result.data?.definition).toEqual(complexDefinition)
    })

    it('testList_WithManyTools_ShouldHandleGracefully', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const manyTools = Array.from({ length: 100 }, (_, i) => ({
        ...mockTool,
        id: `tool-${i}`,
        name: `tool_${i}`,
        version: `${i}.0.0`
      }))
      const expectedResponse: ApiResponse<Tool[]> = {
        data: manyTools,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await toolAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toHaveLength(100)
    })
  })
})
