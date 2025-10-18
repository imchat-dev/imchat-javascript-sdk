// packages/sdk/src/lib/middlewares/logging-middleware.ts

import { Middleware, MiddlewareContext } from "../lib/middleware"

export class LoggingMiddleware implements Middleware {
  name = 'logging'

  async before(context: MiddlewareContext): Promise<void> {
    console.log(`[IMChat SDK] ${context.method} ${context.endpoint}`, {
      input: context.input,
      timestamp: new Date().toISOString(),
    })
  }

  async after(context: MiddlewareContext): Promise<void> {
    console.log(`[IMChat SDK] ${context.method} ${context.endpoint} completed`, {
      output: context.output,
      timestamp: new Date().toISOString(),
    })
  }

  async error(context: MiddlewareContext): Promise<void> {
    console.error(`[IMChat SDK] ${context.method} ${context.endpoint} failed`, {
      error: context.error?.message,
      timestamp: new Date().toISOString(),
    })
  }
}