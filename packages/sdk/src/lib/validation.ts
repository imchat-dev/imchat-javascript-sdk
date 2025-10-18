import { z } from 'zod'

/**
 * ImChat Validation error
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    throw new ValidationError(
      'Validation failed',
      result.error
    )
  }
  
  return result.data
}

export function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  return schema.parseAsync(data)
}