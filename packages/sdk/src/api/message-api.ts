// packages/sdk/src/api/message-api.ts
import z from 'zod'
import { BaseClient } from '../lib/base-client'
import { ApiResponse } from '../types'
import { Message } from '../types/message'
import { CreateMessageSchema } from '../schemas/message'
import { ValidationMiddleware } from '../middlewares/validation-middleware'
import { ProtectedMiddleware } from '../middlewares/protected-middleware'
import { ErrorHandlingMiddleware } from '../middlewares/error-middleware'

export class MessageAPI extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string) {
    super(baseUrl, clientApiKey, serverApiKey)
    this
      .use(new ErrorHandlingMiddleware())
      .use(new ProtectedMiddleware());
  }

  async list(assistantId: string, sessionId: string): Promise<ApiResponse<Message[]>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        sessionId: z.string().min(1),
      }),
    })
    return this.apiCall<Message[]>(`/api/assistants/${assistantId}/sessions/${sessionId}/messages`, { assistantId, sessionId }, {}, [validation])
  }

  async create(
    assistantId: string,
    sessionId: string,
    data: z.infer<typeof CreateMessageSchema>
  ): Promise<ApiResponse<Message>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        sessionId: z.string().min(1),
        data: CreateMessageSchema,
      }),
    })
    return this.apiCall<Message>(`/api/assistants/${assistantId}/sessions/${sessionId}/messages`, { assistantId, sessionId, data }, {
      method: 'POST',
    }, [validation])
  }

  async delete(
    assistantId: string,
    sessionId: string,
    messageId: string
  ): Promise<ApiResponse<void>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        sessionId: z.string().min(1),
        messageId: z.string().min(1),
      }),
    })
    return this.apiCall<void>(`/api/assistants/${assistantId}/sessions/${sessionId}/messages/${messageId}`, { assistantId, sessionId, messageId }, {
      method: 'DELETE',
    }, [validation])
  }
}
