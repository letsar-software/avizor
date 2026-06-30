export const featureFlags = {
  enableMaiz: process.env.ENABLE_MAIZ === "true",
  enableAlertas: process.env.ENABLE_ALERTAS === "true",
  enableObservaciones: process.env.ENABLE_OBSERVACIONES !== "false",
  enableModoExperimental: process.env.ENABLE_MODO_EXPERIMENTAL === "true",
};
