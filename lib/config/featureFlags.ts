export const featureFlags = {
  enableTrigo: process.env.ENABLE_TRIGO !== "false",
  enableMaiz: process.env.ENABLE_MAIZ === "true",
  enableAlertas: process.env.ENABLE_ALERTAS === "true",
  enableObservaciones: process.env.ENABLE_OBSERVACIONES !== "false",
  enablePlagas: process.env.ENABLE_PLAGAS === "true",
};
