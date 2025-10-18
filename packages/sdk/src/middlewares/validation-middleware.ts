// packages/sdk/src/lib/middlewares/validation-middleware.ts
import { z } from 'zod'
import { Middleware, MiddlewareContext } from '../lib/middleware'
import { ValidationError } from '../lib/validation'

export interface ValidationConfig {
    inputSchema?: z.ZodSchema
    outputSchema?: z.ZodSchema
    skipValidation?: boolean
}

export class ValidationMiddleware implements Middleware {
    name = 'validation'

    constructor(private config: ValidationConfig) { }

    async before(context: MiddlewareContext): Promise<void> {
        if (this.config.skipValidation || !this.config.inputSchema) {
            return
        }

        try {
            const validatedInput = this.config.inputSchema.parse(context.input)
            context.input = validatedInput
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Input validation failed', error)
            }
            throw error
        }
    }

    async after(context: MiddlewareContext): Promise<void> {
        if (this.config.skipValidation || !this.config.outputSchema || !context.output) {
            return
        }

        try {
            const validatedOutput = this.config.outputSchema.parse(context.output)
            context.output = validatedOutput
        } catch (error) {
            if (error instanceof z.ZodError) {
                throw new ValidationError('Output validation failed', error)
            }
            throw error
        }
    }
}