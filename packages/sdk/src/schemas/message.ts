import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  assistant_id: z.string().optional(),
  message_role: z.string().min(1),
  content: z.string().min(1),
  model: z.string().optional(),
  provider: z.string().optional(),
  latency_ms: z.number().min(0).optional(),
  prompt_tokens: z.number().min(0).optional(),
  completion_tokens: z.number().min(0).optional(),
  total_tokens: z.number().min(0).optional(),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime().optional(),
});

export const CreateMessageSchema = z.object({
  message_role: z.string().min(1),
  content: z.string().min(1),
  model: z.string().optional(),
  provider: z.string().optional(),
});
