// Solo booleanos/enums seguros — nunca devuelve el valor de un secreto
// (DATABASE_URL, RATE_LIMIT_HASH_SECRET, AVIZOR_INTERNAL_TOKEN, etc.),
// mismo criterio que nunca exponer password_hash/key_hash en una respuesta.
export interface ConfigSnapshot {
  nodeEnv: string;
  databaseSsl: boolean;
  databaseSslRejectUnauthorized: boolean;
  rateLimitTrustedProxy: string | null;
  rateLimitHashSecretConfigurado: boolean;
  avizorInternalTokenConfigurado: boolean;
}

export function getConfigSnapshot(): ConfigSnapshot {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    databaseSsl: process.env.DATABASE_SSL === "true",
    databaseSslRejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    rateLimitTrustedProxy: process.env.RATE_LIMIT_TRUSTED_PROXY || null,
    rateLimitHashSecretConfigurado: Boolean(process.env.RATE_LIMIT_HASH_SECRET),
    avizorInternalTokenConfigurado: Boolean(process.env.AVIZOR_INTERNAL_TOKEN),
  };
}
