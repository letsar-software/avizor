export const ETAPAS_TRIGO = [
  "emergencia", "macollaje", "encanazon", "hoja_bandera", "embuchado",
  "espigazon", "floracion", "llenado_grano", "madurez",
] as const;

export type EtapaTrigo = typeof ETAPAS_TRIGO[number];

export const ETAPA_TRIGO_NOMBRES: Record<EtapaTrigo, string> = {
  emergencia: "Emergencia (Z10)", macollaje: "Macollaje (Z20–29)", encanazon: "Encañazón (Z30–39)",
  hoja_bandera: "Hoja bandera (Z37–39)", embuchado: "Embuchado (Z45–49)", espigazon: "Espigazón (Z50–59)",
  floracion: "Floración (Z60–69)", llenado_grano: "Llenado de grano (Z70–89)", madurez: "Madurez (Z90+)",
};
