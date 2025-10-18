import { z } from "zod";

export const PromptTypeSchema = z.enum(['rag_system', 'memory_summary', 'title', 'tool_instructions']);

export const PromptSchema = z.object({
  type: PromptTypeSchema,
  body: z.string().min(1),
  updated_at: z.iso.datetime(),
});

export const UpdatePromptSchema = z.object({
  type: PromptTypeSchema,
  body: z.string().min(1),
});
