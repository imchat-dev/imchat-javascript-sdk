/**
 * Base client for all clients for the sdk
 */

import { ApiResponse } from "../types"
import { Middleware, MiddlewarePipeline } from "./middleware"

export abstract class BaseClient {
  /**
   * The base url of the api
  */
  protected baseUrl: string
  /**
   * The client api key - used to publicly access the client api
   */
  protected clientApiKey: string
  /**
   * The server api key - used to access the server api (optional)
   */
  protected serverApiKey?: string
  protected timeout: number

  /**
   * The middleware pipeline for the client
   */
  protected middlewarePipeline: MiddlewarePipeline

  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string, timeout = 30000) {
    this.baseUrl = baseUrl
    this.clientApiKey = clientApiKey
    this.serverApiKey = serverApiKey
    this.timeout = timeout
    this.middlewarePipeline = new MiddlewarePipeline()
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      /**
       * TODO: fetch adapter implementation - get adapter from the imchat config
       */
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Api-Key': this.clientApiKey,
          ...(this.serverApiKey && { 'X-Server-Api-Key': this.serverApiKey }),
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      const data = response.ok ? await response.json() : null

      return {
        data,
        status: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      }
    } catch (error) {
      return {
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Middleware management
  use(middleware: Middleware): this {
    this.middlewarePipeline.use(middleware)
    return this
  }

  // API call with middleware
  protected async apiCall<T>(
    endpoint: string,
    input?: unknown,
    options: RequestInit = {},
    middlewares: Middleware[] = []
  ): Promise<ApiResponse<T>> {
    const pipeline = middlewares.length > 0 
      ? this.middlewarePipeline.withMiddlewares(middlewares)
      : this.middlewarePipeline;

    return pipeline.execute(
      options?.method || 'GET',
      endpoint,
      input,
      this,
      async () => {
        return this.request<T>(endpoint, options)
      }
    )
  }

  hasServerApiKey(): boolean {
    return !!this.serverApiKey
  }
}