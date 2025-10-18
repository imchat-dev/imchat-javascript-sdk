// packages/sdk/src/api/session-api.ts
import z from 'zod'
import { BaseClient } from '../lib/base-client'
import { ApiResponse } from '../types'
import { Session } from '../types/session'
import { ValidationMiddleware } from '../middlewares/validation-middleware'
import { ProtectedMiddleware } from '../middlewares/protected-middleware'
import { ErrorHandlingMiddleware } from '../middlewares/error-middleware'

export class SessionAPI extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string) {
    super(baseUrl, clientApiKey, serverApiKey)
    this
      .use(new ErrorHandlingMiddleware())
      .use(new ProtectedMiddleware());
  }

  async list(assistantId: string): Promise<ApiResponse<Session[]>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.string().min(1),
    })
    return this.apiCall<Session[]>(`/api/assistants/${assistantId}/sessions`, assistantId, {}, [validation])
  }

  async get(assistantId: string, sessionId: string): Promise<ApiResponse<Session>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        sessionId: z.string().min(1),
      }),
    })
    return this.apiCall<Session>(`/api/assistants/${assistantId}/sessions/${sessionId}`, { assistantId, sessionId }, {}, [validation])
  }

  async create(assistantId: string): Promise<ApiResponse<Session>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.string().min(1),
    })
    return this.apiCall<Session>(`/api/assistants/${assistantId}/sessions`, assistantId, {
      method: 'POST',
    }, [validation])
  }

  async delete(assistantId: string, sessionId: string): Promise<ApiResponse<void>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        sessionId: z.string().min(1),
      }),
    })
    return this.apiCall<void>(`/api/assistants/${assistantId}/sessions/${sessionId}`, { assistantId, sessionId }, {
      method: 'DELETE',
    }, [validation])
  }
}
