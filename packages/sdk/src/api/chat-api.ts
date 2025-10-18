// packages/sdk/src/api/chat-api.ts
import z from 'zod'
import { BaseClient } from '../lib/base-client'
import { ApiResponse } from '../types'
import { ChatRequest, ChatResponse } from '../types/chat'
import { ChatRequestSchema } from '../schemas/chat'
import { ValidationMiddleware } from '../middlewares/validation-middleware'
import { ProtectedMiddleware } from '../middlewares/protected-middleware'
import { ErrorHandlingMiddleware } from '../middlewares/error-middleware'

export class ChatAPI extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string) {
    super(baseUrl, clientApiKey, serverApiKey)
    this
      .use(new ErrorHandlingMiddleware())
      .use(new ProtectedMiddleware());
  }

  async send(assistantId: string, data: z.infer<typeof ChatRequestSchema>): Promise<ApiResponse<ChatResponse>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        data: ChatRequestSchema,
      }),
    })
    return this.apiCall<ChatResponse>(`/api/assistants/${assistantId}/chat`, { assistantId, data }, {
      method: 'POST',
    }, [validation])
  }

  // Legacy endpoint support
  async sendLegacy(assistantId: string, data: z.infer<typeof ChatRequestSchema>): Promise<ApiResponse<ChatResponse>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        data: ChatRequestSchema,
      }),
    })
    return this.apiCall<ChatResponse>(`/chat/${assistantId}`, { assistantId, data }, {
      method: 'POST',
    }, [validation])
  }
}
