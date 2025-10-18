import z from "zod";
import { SessionSchema } from "../schemas/session";

export type Session = z.infer<typeof SessionSchema>;
