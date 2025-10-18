import z from "zod";
import { ChatRequestSchema, ChatResponseSchema } from "../schemas/chat";

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
