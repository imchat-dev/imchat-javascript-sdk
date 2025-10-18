import z from "zod";
import { AssistantSchema } from "../schemas/assistant";

export type Assistant = z.infer<typeof AssistantSchema>