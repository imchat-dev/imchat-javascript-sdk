import { z } from "zod";

export const ModelSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  max_tokens: z.number().min(1),
  supports_functions: z.boolean(),
});

export const ProviderSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  models: z.array(ModelSchema),
});
