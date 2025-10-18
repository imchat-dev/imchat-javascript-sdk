import { z } from "zod";

export const ChatRequestSchema = z.object({
  session_id: z.string().optional(),
  question: z.string().min(1),
  model_override: z.string().optional(),
  temperature_override: z.number().min(0).max(1).optional(),
});

export const ToolCallSchema = z.object({
  name: z.string(),
  arguments: z.record(z.string(), z.any()),
  result: z.any(),
  execution_time_ms: z.number().min(0),
});

export const ChatResponseSchema = z.object({
  answer: z.string(),
  assistant_id: z.string(),
  session_id: z.string(),
  model: z.string(),
  provider: z.string(),
  message_id: z.string(),
  tool_calls: z.array(ToolCallSchema).optional(),
  metadata: z.object({
    tokens_used: z.number().min(0).optional(),
  }),
});
