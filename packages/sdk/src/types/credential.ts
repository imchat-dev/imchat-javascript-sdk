import z from "zod";
import { CredentialSchema } from "../schemas/credential";

export type Credential = z.infer<typeof CredentialSchema>;
