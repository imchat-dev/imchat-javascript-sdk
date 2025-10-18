// packages/sdk/src/lib/middleware.ts

import { BaseClient } from "./base-client"

/**
 * ImChat Middleware context
 */
export interface MiddlewareContext<T = any> {
  client: BaseClient
  method: string
  endpoint: string
  input?: unknown
  output?: T
  error?: Error
  metadata?: Record<string, any>
}

export interface Middleware<T = any> {
  name: string
  before?: (context: MiddlewareContext<T>) => Promise<void> | void
  after?: (context: MiddlewareContext<T>) => Promise<void> | void
  error?: (context: MiddlewareContext<T>) => Promise<void> | void
}

export class MiddlewarePipeline<T = any> {
  private middlewares: Middleware<T>[] = []

  use(middleware: Middleware<T>): this {
    if (this.middlewares.some(m => m.name === middleware.name)) {
      // TODO: get parameter as Replace or forceReplace and replace the middleware with the new one
      return this;
    }
    this.middlewares.push(middleware)
    return this
  }

  withMiddlewares(middlewares: Middleware<T>[]): MiddlewarePipeline<T> {
    const newPipeline = new MiddlewarePipeline<T>()
    newPipeline.middlewares = [...this.middlewares]
    middlewares.forEach(middleware => newPipeline.use(middleware))
    return newPipeline
  }

  async execute(
    method: string,
    endpoint: string,
    input: unknown,
    client: BaseClient,
    handler: () => Promise<T>
  ): Promise<T> {
    const context: MiddlewareContext<T> = {
      method,
      endpoint,
      input,
      client
    }

    try {
      // Execute before middlewares
      for (const middleware of this.middlewares) {
        if (middleware.before) {
          await middleware.before(context)
        }
      }

      // Execute the actual handler
      const result = await handler()
      context.output = result

      // Execute after middlewares
      for (const middleware of this.middlewares) {
        if (middleware.after) {
          await middleware.after(context)
        }
      }

      return result
    } catch (error) {
      context.error = error as Error

      // Execute error middlewares
      for (const middleware of this.middlewares) {
        if (middleware.error) {
          await middleware.error(context)
        }
      }

      throw error
    }
  }
}