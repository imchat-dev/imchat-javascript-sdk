/**
 * Common schemas for the sdk
 */
import { z } from 'zod'

/**
 * Api response schema
 */
export const ApiResponseSchema = z.object({
  data: z.any().optional(),
  error: z.string().optional(),
  status: z.number(),
})

export const ErrorSchema = z.object({
  message: z.string(),
  status: z.number(),
  details: z.any().optional(),
})
