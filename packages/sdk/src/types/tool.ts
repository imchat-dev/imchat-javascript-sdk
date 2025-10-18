import z from "zod";
import { ToolSchema } from "../schemas/tool";

export type Tool = z.infer<typeof ToolSchema>;
