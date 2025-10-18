// packages/sdk/src/api/credential-api.ts
import z from 'zod'
import { BaseClient } from '../lib/base-client'
import { ApiResponse } from '../types'
import { Credential } from '../types/credential'
import { CreateCredentialSchema } from '../schemas/credential'
import { ValidationMiddleware } from '../middlewares/validation-middleware'
import { ProtectedMiddleware } from '../middlewares/protected-middleware'
import { ErrorHandlingMiddleware } from '../middlewares/error-middleware'

export class CredentialAPI extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string) {
    super(baseUrl, clientApiKey, serverApiKey)
    this
      .use(new ErrorHandlingMiddleware())
      .use(new ProtectedMiddleware());
  }

  async list(assistantId: string): Promise<ApiResponse<Credential[]>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.string().min(1),
    })
    return this.apiCall<Credential[]>(`/api/assistants/${assistantId}/credentials`, assistantId, {}, [validation])
  }

  async create(
    assistantId: string,
    data: z.infer<typeof CreateCredentialSchema>
  ): Promise<ApiResponse<Credential>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        data: CreateCredentialSchema,
      }),
    })
    return this.apiCall<Credential>(`/api/assistants/${assistantId}/credentials`, { assistantId, data }, {
      method: 'POST',
    }, [validation])
  }
}
