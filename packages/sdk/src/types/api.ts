import z from "zod"
import { ErrorSchema } from "../schemas"

export type ApiResponse<T = any> = {
    data?: T
    error?: string
    status: number
  }
  
  export type ApiError = z.infer<typeof ErrorSchema>