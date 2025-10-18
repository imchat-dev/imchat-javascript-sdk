import z from "zod";
import { MessageSchema } from "../schemas/message";

export type Message = z.infer<typeof MessageSchema>;
