import z from "zod";
import { DocumentSchema } from "../schemas/document";

export type Document = z.infer<typeof DocumentSchema>;
