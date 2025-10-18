// packages/sdk/src/lib/middlewares/error-middleware.ts
import { Middleware, MiddlewareContext } from '../lib/middleware'
import { ValidationError } from '../lib/validation'
import { ApiResponse } from '../types'
export class ErrorHandlingMiddleware implements Middleware {
    name = 'error-handling'

    async error(context: MiddlewareContext): Promise<void> {
        if (context.error instanceof ValidationError) {
            // Convert validation error to API response format
            const errorResponse: ApiResponse = {
                status: 400,
                error: `Validation failed: ${context.error.message}`,
                data: undefined,
            }

            // Replace the error with the formatted response
            context.output = errorResponse
            context.error = undefined
        }
    }
}