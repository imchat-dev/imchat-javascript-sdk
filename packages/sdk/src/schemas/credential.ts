import { z } from "zod";

export const CredentialSchema = z.object({
  provider: z.string().min(1).max(255),
  api_key: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.any()),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime().optional(),
});

export const CreateCredentialSchema = z.object({
  provider: z.string().min(1).max(255),
  api_key: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});
