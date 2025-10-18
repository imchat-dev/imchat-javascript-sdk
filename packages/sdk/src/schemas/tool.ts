import { z } from "zod";

export const ToolTransportSchema = z.enum(['https', 'mcp']);
export const ToolStatusSchema = z.enum(['active', 'inactive']);

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  definition: z.record(z.string(), z.any()),
  transport: ToolTransportSchema,
  status: ToolStatusSchema,
  version: z.string().min(1),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime().optional(),
});

export const CreateToolSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  definition: z.record(z.string(), z.any()),
  transport: ToolTransportSchema,
});

export const UpdateToolSchema = ToolSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true,
});
