import { z } from "zod";

export const SessionSchema = z.object({
  id: z.string(),
  assistant_id: z.string(),
  title: z.string().max(255).optional(),
  title_locked: z.boolean(),
  started_at: z.iso.datetime(),
  last_activity_at: z.iso.datetime(),
  client_ip: z.string().optional(),
  user_agent: z.string().optional(),
  updated_at: z.iso.datetime().optional(),
});
