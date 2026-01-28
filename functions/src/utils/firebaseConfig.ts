import { defineJsonSecret } from "firebase-functions/params";

export const SECRETS = defineJsonSecret<Secrets>("FUNCTIONS_CONFIG_EXPORT");
