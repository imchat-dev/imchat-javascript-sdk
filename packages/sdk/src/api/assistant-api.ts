// packages/sdk/src/api/assistant-api.ts
import z from 'zod'
import { BaseClient } from '../lib/base-client'
import { ApiResponse } from '../types'
import { Assistant } from '../types/assistant'
import { CreateAssistantSchema, UpdateAssistantSchema } from '../schemas'
import { ValidationMiddleware } from '../middlewares/validation-middleware'
import { ProtectedMiddleware } from '../middlewares/protected-middleware'
import { ErrorHandlingMiddleware } from '../middlewares/error-middleware'

export class AssistantAPI extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string) {
    super(baseUrl, clientApiKey, serverApiKey)
    this
      .use(new ErrorHandlingMiddleware())
      .use(new ProtectedMiddleware());
  }

  async create(data: z.infer<typeof CreateAssistantSchema>): Promise<ApiResponse<Assistant>> {
    const validation = new ValidationMiddleware({
      inputSchema: CreateAssistantSchema,
    })
    return this.apiCall<Assistant>('/api/assistants', data, {
      method: 'POST',
    }, [validation])
  }

  async get(assistantId: string): Promise<ApiResponse<Assistant>> {
    return this.apiCall<Assistant>(`/api/assistants/${assistantId}`)
  }

  async list(): Promise<ApiResponse<Assistant[]>> {
    return this.apiCall<Assistant[]>('/api/assistants')
  }

  async update(assistantId: string, data: z.infer<typeof UpdateAssistantSchema>): Promise<ApiResponse<Assistant>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        data: UpdateAssistantSchema,
      }),
    })
    return this.apiCall<Assistant>(`/api/assistants/${assistantId}`, { assistantId, data }, {
      method: 'PUT',
    }, [validation])
  }

  async delete(assistantId: string): Promise<ApiResponse<void>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.string().min(1),
    })
    return this.apiCall<void>(`/api/assistants/${assistantId}`, assistantId, {
      method: 'DELETE',
    }, [validation])
  }

  async reindex(assistantId: string, sources: string[]): Promise<ApiResponse<void>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        sources: z.array(z.string()).min(1),
      }),
    })
    return this.apiCall<void>(`/api/assistants/${assistantId}/reindex`, { sources }, {
      method: 'POST',
    }, [validation])
  }
}