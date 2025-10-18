/**
 * Comprehensive test suite for DocumentAPI
 * Following TestNG-style patterns adapted for Jest
 * Tests cover Controller → Service → Repository → DB flow simulation
 */

import { DocumentAPI } from '../document-api'
import { BaseClient } from '../../lib/base-client'
import { ApiResponse } from '../../types'
import { Document } from '../../types/document'
import { DocumentUploadOptionsSchema, DocumentIndexOptionsSchema } from '../../schemas/document'

describe('DocumentAPI Integration Tests', () => {
  let documentAPI: DocumentAPI
  let mockApiCall: jest.MockedFunction<any>
  let mockUploadFile: jest.MockedFunction<any>
  const baseUrl = 'https://api.imchat.ai/'
  const clientApiKey = 'test-client-key'
  const serverApiKey = 'test-server-key'

  // Test data fixtures
  const mockDocument: Document = {
    id: 'doc-123',
    name: 'test-document.pdf',
    filepath: '/uploads/test-document.pdf',
    ext: 'pdf',
    file_size: 1024000,
    created_at: '2024-01-01T00:00:00.000Z',
    indexed_at: '2024-01-01T00:05:00.000Z'
  }

  const mockFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' })

  const mockUploadOptions = {
    auto_index: true,
    chunk_size: 1000,
    chunk_overlap: 50
  }

  const mockIndexOptions = {
    chunk_size: 1000,
    chunk_overlap: 50
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    
    // Create DocumentAPI instance
    documentAPI = new DocumentAPI(baseUrl, clientApiKey, serverApiKey)
    
    // Mock the apiCall and uploadFile methods
    mockApiCall = jest.fn();
    mockUploadFile = jest.fn();
    (documentAPI as any).apiCall = mockApiCall
    Object.defineProperty(documentAPI, 'uploadFile', {
      value: mockUploadFile,
      writable: true
    })
  })

  describe('Constructor and Middleware Setup', () => {
    it('testConstructor_WithValidParams_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new DocumentAPI(baseUrl, clientApiKey, serverApiKey)

      // Assert
      expect(api).toBeInstanceOf(DocumentAPI)
    })

    it('testConstructor_WithOptionalServerKey_ShouldInitializeCorrectly', () => {
      // Arrange & Act
      const api = new DocumentAPI(baseUrl, clientApiKey)

      // Assert
      expect(api).toBeInstanceOf(DocumentAPI)
    })
  })

  describe('List Documents Tests', () => {
    it('testList_HappyPath_ShouldReturnDocumentArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const mockDocuments = [mockDocument, { ...mockDocument, id: 'doc-456' }]
      const expectedResponse: ApiResponse<Document[]> = {
        data: mockDocuments,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/docs`,
        assistantId,
        {},
        expect.any(Array)
      )
    })

    it('testList_WithEmptyList_ShouldReturnEmptyArray', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Document[]> = {
        data: [],
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.list(assistantId)

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
      const expectedResponse: ApiResponse<Document[]> = {
        data: undefined,
        status: 400,
        error: 'Invalid assistant ID'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.list(assistantId)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid assistant ID')
    })
  })

  describe('Get Document Tests', () => {
    it('testGet_HappyPath_ShouldReturnDocument', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const docId = 'doc-123'
      const expectedResponse: ApiResponse<Document> = {
        data: mockDocument,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.get(assistantId, docId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockDocument)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/docs/${docId}`,
        { assistantId, docId },
        {},
        expect.any(Array)
      )
    })

    it('testGet_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const docId = 'non-existent-doc'
      const expectedResponse: ApiResponse<Document> = {
        data: undefined,
        status: 404,
        error: 'Document not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.get(assistantId, docId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Document not found')
    })
  })

  describe('Upload Document Tests', () => {
    it('testUpload_HappyPath_ShouldReturnDocument', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Document> = {
        data: mockDocument,
        status: 201,
        error: undefined
      }
      mockUploadFile.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.upload(assistantId, mockFile, mockUploadOptions)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(mockDocument)
      expect(result.error).toBeUndefined()
      expect(mockUploadFile).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/docs/upload`,
        mockFile,
        {
          auto_index: 'true',
          chunk_size: '1000',
          chunk_overlap: '50'
        }
      )
    })

    it('testUpload_WithoutOptions_ShouldUseDefaults', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const expectedResponse: ApiResponse<Document> = {
        data: mockDocument,
        status: 201,
        error: undefined
      }
      mockUploadFile.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.upload(assistantId, mockFile)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
      expect(mockUploadFile).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/docs/upload`,
        mockFile,
        {}
      )
    })

    it('testUpload_WithInvalidFile_ShouldReturnError', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const invalidFile = null as any
      const expectedResponse: ApiResponse<Document> = {
        data: undefined,
        status: 400,
        error: 'Invalid file provided'
      }
      mockUploadFile.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.upload(assistantId, invalidFile)

      // Assert
      expect(result.status).toBe(400)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Invalid file provided')
    })
  })

  describe('Delete Document Tests', () => {
    it('testDelete_HappyPath_ShouldReturnSuccess', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const docId = 'doc-123'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 204,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.delete(assistantId, docId)

      // Assert
      expect(result.status).toBe(204)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/docs/${docId}`,
        { assistantId, docId },
        { method: 'DELETE' },
        expect.any(Array)
      )
    })

    it('testDelete_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const docId = 'non-existent-doc'
      const expectedResponse: ApiResponse<void> = {
        data: undefined,
        status: 404,
        error: 'Document not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.delete(assistantId, docId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Document not found')
    })
  })

  describe('Index Document Tests', () => {
    it('testIndex_HappyPath_ShouldReturnIndexResult', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const docId = 'doc-123'
      const indexResult = {
        document_id: docId,
        chunks_created: 10,
        indexed_at: '2024-01-01T00:10:00.000Z',
        status: 'completed'
      }
      const expectedResponse: ApiResponse<typeof indexResult> = {
        data: indexResult,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.index(assistantId, docId, mockIndexOptions)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(result.data).toEqual(indexResult)
      expect(result.error).toBeUndefined()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/docs/${docId}/index`,
        { assistantId, docId, options: mockIndexOptions },
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testIndex_WithDefaultOptions_ShouldUseDefaults', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const docId = 'doc-123'
      const indexResult = {
        document_id: docId,
        chunks_created: 5,
        indexed_at: '2024-01-01T00:10:00.000Z',
        status: 'completed'
      }
      const expectedResponse: ApiResponse<typeof indexResult> = {
        data: indexResult,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.index(assistantId, docId)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
      expect(mockApiCall).toHaveBeenCalledWith(
        `/api/assistants/${assistantId}/docs/${docId}/index`,
        { assistantId, docId, options: { chunk_size: 1000, chunk_overlap: 50 } },
        { method: 'POST' },
        expect.any(Array)
      )
    })

    it('testIndex_WithNotFound_ShouldReturn404', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const docId = 'non-existent-doc'
      const expectedResponse: ApiResponse<any> = {
        data: undefined,
        status: 404,
        error: 'Document not found'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.index(assistantId, docId)

      // Assert
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Document not found')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('testApiCall_WithTimeout_ShouldHandleGracefully', async () => {
      // Arrange
      mockApiCall.mockRejectedValue(new Error('Request timeout'))

      // Act & Assert
      await expect(documentAPI.get('assistant-123', 'doc-123')).rejects.toThrow('Request timeout')
    })

    it('testUploadFile_WithNetworkFailure_ShouldReturnError', async () => {
      // Arrange
      mockUploadFile.mockRejectedValue(new Error('Network failure'))

      // Act & Assert
      await expect(documentAPI.upload('assistant-123', mockFile)).rejects.toThrow('Network failure')
    })

    it('testApiCall_WithUnauthorizedAccess_ShouldReturn401', async () => {
      // Arrange
      const expectedResponse: ApiResponse<Document> = {
        data: undefined,
        status: 401,
        error: 'Unauthorized access'
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.get('assistant-123', 'doc-123')

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
      const result = await documentAPI.delete('assistant-123', 'doc-123')

      // Assert
      expect(result.status).toBe(403)
      expect(result.data).toBeUndefined()
      expect(result.error).toBe('Forbidden access')
    })
  })

  describe('Boundary Value Tests', () => {
    it('testUpload_WithLargeFile_ShouldHandleGracefully', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const largeFile = new File(['x'.repeat(10000000)], 'large-file.pdf', { type: 'application/pdf' })
      const expectedResponse: ApiResponse<Document> = {
        data: { ...mockDocument, file_size: 10000000 },
        status: 201,
        error: undefined
      }
      mockUploadFile.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.upload(assistantId, largeFile)

      // Assert
      expect(result.status).toBe(201)
      expect(result.data).not.toBeNull()
    })

    it('testIndex_WithMaximumChunkSize_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const docId = 'doc-123'
      const maxOptions = { chunk_size: 10000, chunk_overlap: 1000 }
      const indexResult = {
        document_id: docId,
        chunks_created: 1,
        indexed_at: '2024-01-01T00:10:00.000Z',
        status: 'completed'
      }
      const expectedResponse: ApiResponse<typeof indexResult> = {
        data: indexResult,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.index(assistantId, docId, maxOptions)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })

    it('testIndex_WithMinimumChunkSize_ShouldSucceed', async () => {
      // Arrange
      const assistantId = 'assistant-123'
      const docId = 'doc-123'
      const minOptions = { chunk_size: 1, chunk_overlap: 0 }
      const indexResult = {
        document_id: docId,
        chunks_created: 100,
        indexed_at: '2024-01-01T00:10:00.000Z',
        status: 'completed'
      }
      const expectedResponse: ApiResponse<typeof indexResult> = {
        data: indexResult,
        status: 200,
        error: undefined
      }
      mockApiCall.mockResolvedValue(expectedResponse)

      // Act
      const result = await documentAPI.index(assistantId, docId, minOptions)

      // Assert
      expect(result.status).toBe(200)
      expect(result.data).not.toBeNull()
    })
  })
})
