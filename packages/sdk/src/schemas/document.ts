import { z } from "zod";

export const DocumentSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  filepath: z.string().min(1),
  ext: z.string().min(1).max(10),
  file_size: z.number().min(0).optional(),
  created_at: z.iso.datetime(),
  indexed_at: z.iso.datetime().optional(),
});

export const DocumentUploadOptionsSchema = z.object({
  auto_index: z.boolean().optional(),
  chunk_size: z.number().min(1).max(10000).optional(),
  chunk_overlap: z.number().min(0).max(1000).optional(),
});

export const DocumentIndexOptionsSchema = z.object({
  chunk_size: z.number().min(1).max(10000).optional(),
  chunk_overlap: z.number().min(0).max(1000).optional(),
});
