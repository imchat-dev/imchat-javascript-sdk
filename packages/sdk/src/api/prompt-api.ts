// packages/sdk/src/api/prompt-api.ts
import z from 'zod'
import { BaseClient } from '../lib/base-client'
import { ApiResponse } from '../types'
import { Prompt } from '../types/prompt'
import { PromptTypeSchema, UpdatePromptSchema } from '../schemas/prompt'
import { ValidationMiddleware } from '../middlewares/validation-middleware'
import { ProtectedMiddleware } from '../middlewares/protected-middleware'
import { ErrorHandlingMiddleware } from '../middlewares/error-middleware'

export class PromptAPI extends BaseClient {
  constructor(baseUrl: string, clientApiKey: string, serverApiKey?: string) {
    super(baseUrl, clientApiKey, serverApiKey)
    this
      .use(new ErrorHandlingMiddleware())
      .use(new ProtectedMiddleware());
  }

  async get(
    assistantId: string,
    promptType: z.infer<typeof PromptTypeSchema>
  ): Promise<ApiResponse<Prompt>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        promptType: PromptTypeSchema,
      }),
    })
    return this.apiCall<Prompt>(`/api/assistants/${assistantId}/prompts/${promptType}`, { assistantId, promptType }, {}, [validation])
  }

  async update(
    assistantId: string,
    promptType: z.infer<typeof PromptTypeSchema>,
    body: string
  ): Promise<ApiResponse<Prompt>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        promptType: PromptTypeSchema,
        body: z.string().min(1),
      }),
    })
    return this.apiCall<Prompt>(`/api/assistants/${assistantId}/prompts/${promptType}`, { assistantId, promptType, body }, {
      method: 'PUT',
    }, [validation])
  }

  async delete(
    assistantId: string,
    promptType: z.infer<typeof PromptTypeSchema>
  ): Promise<ApiResponse<void>> {
    const validation = new ValidationMiddleware({
      inputSchema: z.object({
        assistantId: z.string().min(1),
        promptType: PromptTypeSchema,
      }),
    })
    return this.apiCall<void>(`/api/assistants/${assistantId}/prompts/${promptType}`, { assistantId, promptType }, {
      method: 'DELETE',
    }, [validation])
  }
}
