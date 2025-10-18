import { z } from "zod";

export const AssistantSchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    provider: z.string().min(1).max(255),
    model: z.string().min(1).max(255),
    temperature: z.number().min(0).max(1).optional(),
    top_p: z.number().min(0).max(1).optional(),
    max_output_tokens: z.number().min(0).optional(),
    embedding_provider: z.string().min(1).max(255).optional(),
    embedding_model: z.string().min(1).max(255).optional(),
    embedding_dimension: z.number().min(0).optional(),
    retrieval_config: z.record(z.string(), z.any()).optional(),
    created_at: z.iso.datetime(),
    updated_at: z.iso.datetime().optional(),
})

export const CreateAssistantSchema = AssistantSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
})

export const UpdateAssistantSchema = AssistantSchema.partial()