// packages/sdk/src/api/document-api.ts
import z from 'zod'
import { BaseClient } from '../lib/base-client'
import { ApiResponse } from '../types'
import { Document } from '../types/document'
import { DocumentUploadOptionsSchema, DocumentIndexOptionsSchema } from '../schemas/document'
import { ValidationMiddleware } from '../middlewares/validation-middleware'
import { ProtectedMiddleware } from '../middlewares/protected-middleware'
import { ErrorHandlingMiddleware } from '../middlewares/error-middleware'

export class DocumentAPI extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string) {
    super(baseUrl, clientApiKey, serverApiKey)
    this
      .use(new ErrorHandlingMiddleware())
      .use(new ProtectedMiddleware());
  }

  async list(assistantId: string): Promise<ApiResponse<Document[]>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.string().min(1),
    })
    return this.apiCall<Document[]>(`/api/assistants/${assistantId}/docs`, assistantId, {}, [validation])
  }

  async get(assistantId: string, docId: string): Promise<ApiResponse<Document>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        docId: z.string().min(1),
      }),
    })
    return this.apiCall<Document>(`/api/assistants/${assistantId}/docs/${docId}`, { assistantId, docId }, {}, [validation])
  }

  async upload(
    assistantId: string,
    file: File,
    options?: z.infer<typeof DocumentUploadOptionsSchema>
  ): Promise<ApiResponse<Document>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        file: z.instanceof(File),
        options: DocumentUploadOptionsSchema.optional(),
      }),
    })
    
    const additionalData: Record<string, string> = {}
    if (options?.auto_index !== undefined) {
      additionalData.auto_index = options.auto_index.toString()
    }
    if (options?.chunk_size) {
      additionalData.chunk_size = options.chunk_size.toString()
    }
    if (options?.chunk_overlap) {
      additionalData.chunk_overlap = options.chunk_overlap.toString()
    }

    return this.uploadFile<Document>(
      `/api/assistants/${assistantId}/docs/upload`,
      file,
      additionalData
    )
  }

  async delete(assistantId: string, docId: string): Promise<ApiResponse<void>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        docId: z.string().min(1),
      }),
    })
    return this.apiCall<void>(`/api/assistants/${assistantId}/docs/${docId}`, { assistantId, docId }, {
      method: 'DELETE',
    }, [validation])
  }

  async index(
    assistantId: string,
    docId: string,
    options?: z.infer<typeof DocumentIndexOptionsSchema>
  ): Promise<ApiResponse<{
    document_id: string
    chunks_created: number
    indexed_at: string
    status: string
  }>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        docId: z.string().min(1),
        options: DocumentIndexOptionsSchema.optional(),
      }),
    })
    
    const data = {
      chunk_size: options?.chunk_size || 1000,
      chunk_overlap: options?.chunk_overlap || 50,
    }
    
    return this.apiCall(`/api/assistants/${assistantId}/docs/${docId}/index`, { assistantId, docId, options: data }, {
      method: 'POST',
    }, [validation])
  }
}
