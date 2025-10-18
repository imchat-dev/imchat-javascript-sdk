// packages/sdk/src/api/tool-api.ts
import z from 'zod'
import { BaseClient } from '../lib/base-client'
import { ApiResponse } from '../types'
import { Tool } from '../types/tool'
import { CreateToolSchema, UpdateToolSchema } from '../schemas/tool'
import { ValidationMiddleware } from '../middlewares/validation-middleware'
import { ProtectedMiddleware } from '../middlewares/protected-middleware'
import { ErrorHandlingMiddleware } from '../middlewares/error-middleware'

export class ToolAPI extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string) {
    super(baseUrl, clientApiKey, serverApiKey)
    this
      .use(new ErrorHandlingMiddleware())
      .use(new ProtectedMiddleware());
  }

  async list(assistantId: string): Promise<ApiResponse<Tool[]>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.string().min(1),
    })
    return this.apiCall<Tool[]>(`/api/assistants/${assistantId}/tools`, assistantId, {}, [validation])
  }

  async get(assistantId: string, toolId: string): Promise<ApiResponse<Tool>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        toolId: z.string().min(1),
      }),
    })
    return this.apiCall<Tool>(`/api/assistants/${assistantId}/tools/${toolId}`, { assistantId, toolId }, {}, [validation])
  }

  async create(
    assistantId: string,
    data: z.infer<typeof CreateToolSchema>
  ): Promise<ApiResponse<Tool>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        data: CreateToolSchema,
      }),
    })
    return this.apiCall<Tool>(`/api/assistants/${assistantId}/tools`, { assistantId, data }, {
      method: 'POST',
    }, [validation])
  }

  async update(
    assistantId: string,
    toolId: string,
    data: z.infer<typeof UpdateToolSchema>
  ): Promise<ApiResponse<Tool>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        toolId: z.string().min(1),
        data: UpdateToolSchema,
      }),
    })
    return this.apiCall<Tool>(`/api/assistants/${assistantId}/tools/${toolId}`, { assistantId, toolId, data }, {
      method: 'PUT',
    }, [validation])
  }

  async delete(assistantId: string, toolId: string): Promise<ApiResponse<void>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        toolId: z.string().min(1),
      }),
    })
    return this.apiCall<void>(`/api/assistants/${assistantId}/tools/${toolId}`, { assistantId, toolId }, {
      method: 'DELETE',
    }, [validation])
  }

  async getVersions(assistantId: string, toolId: string): Promise<ApiResponse<Tool[]>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        toolId: z.string().min(1),
      }),
    })
    return this.apiCall<Tool[]>(`/api/assistants/${assistantId}/tools/${toolId}/versions`, { assistantId, toolId }, {}, [validation])
  }

  async rotateSecret(assistantId: string, toolId: string): Promise<ApiResponse<{
    new_secret: string
    expires_at: string
  }>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        toolId: z.string().min(1),
      }),
    })
    return this.apiCall(`/api/assistants/${assistantId}/tools/${toolId}/rotate-secret`, { assistantId, toolId }, {
      method: 'POST',
    }, [validation])
  }
}
