import z from 'zod'
import { Middleware, MiddlewareContext } from '../lib/middleware'
import { ValidationError } from '../lib/validation'

/**
 * ProtectedMiddleware ensures that endpoints are only accessible if the BaseClient has a serverApiKey.
 */
export class ProtectedMiddleware implements Middleware {
  name = 'protected'

  async before(context: MiddlewareContext): Promise<void> {
    // Server API key must exist for protected routes
    if (!context.client || !context.client.hasServerApiKey()) {
      let error = new Error('Access denied: server API key required for protected operation.')
      error.name = 'ProtectedError'
      throw error
    }
  }
}
