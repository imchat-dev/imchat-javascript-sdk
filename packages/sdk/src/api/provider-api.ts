// packages/sdk/src/api/provider-api.ts
import z from 'zod'
import { BaseClient } from '../lib/base-client'
import { ApiResponse } from '../types'
import { Provider } from '../types/provider'
import { ValidationMiddleware } from '../middlewares/validation-middleware'
import { ProtectedMiddleware } from '../middlewares/protected-middleware'
import { ErrorHandlingMiddleware } from '../middlewares/error-middleware'

export class ProviderAPI extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string) {
    super(baseUrl, clientApiKey, serverApiKey)
    this
      .use(new ErrorHandlingMiddleware())
      .use(new ProtectedMiddleware());
  }

  async list(): Promise<ApiResponse<{ providers: Provider[] }>> {
    return this.apiCall<{ providers: Provider[] }>('/api/providers')
  }

  async get(providerId: string): Promise<ApiResponse<Provider>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.string().min(1),
    })
    return this.apiCall<Provider>(`/api/providers/${providerId}`, providerId, {}, [validation])
  }
}
