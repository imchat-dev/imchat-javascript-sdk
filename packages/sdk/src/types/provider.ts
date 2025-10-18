import z from "zod";
import { ProviderSchema } from "../schemas/provider";

export type Provider = z.infer<typeof ProviderSchema>;
