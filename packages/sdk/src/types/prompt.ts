import z from "zod";
import { PromptSchema } from "../schemas/prompt";

export type Prompt = z.infer<typeof PromptSchema>;
