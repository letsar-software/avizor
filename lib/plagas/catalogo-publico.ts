export type TipoFicha = "plaga" | "enfermedad";
export type EstadoFicha = "informacion" | "en_validacion" | "no_evaluable";
export type EstadoReglaClimatica =
  "sin_regla" | "pendiente_validacion" | "experimental" | "aprobada";

export interface FichaSanitaria {
  id: string;
  nombre: string;
  cientifico?: string;
  cultivo: "soja" | "trigo";
  tipo: TipoFicha;
  estado: EstadoFicha;
  estadoReglaClimatica: EstadoReglaClimatica;
  etapa?: string;
  descripcion: string;
  ambiente?: string[];
  observar?: string[];
  regiones?: string[];
  observaciones?: string[];
  fuentes: string[];
}

// Catálogo informativo trazable: no contiene umbrales ni ejecuta reglas.
// Las reglas climáticas continúan en PostgreSQL y sólo las evalúa el motor.
const PLAGAS = "Natali — Plagas de la soja y condiciones ambientales (v0.4)";
const PATOGENOS =
  "Natali — Patógenos de soja y condiciones ambientales (14-08)";

function plaga(
  id: string,
  nombre: string,
  cientifico: string | undefined,
  descripcion: string,
  ambiente: string | undefined,
  etapa: string | undefined,
  regiones: string | undefined,
  fuentes: string[],
  estado: EstadoFicha = "informacion",
  estadoReglaClimatica: EstadoReglaClimatica = "sin_regla",
  observar?: string[],
  observaciones?: string[],
): FichaSanitaria {
  return {
    id,
    nombre,
    cientifico,
    cultivo: "soja",
    tipo: "plaga",
    estado,
    estadoReglaClimatica,
    descripcion,
    ambiente: ambiente ? [ambiente] : undefined,
    etapa,
    regiones: regiones ? [regiones] : undefined,
    observar,
    observaciones,
    fuentes: [PLAGAS, ...fuentes],
  };
}

function patogeno(
  id: string,
  nombre: string,
  cientifico: string | undefined,
  descripcion: string,
  ambiente: string,
  etapa: string,
): FichaSanitaria {
  return {
    id,
    nombre,
    cientifico,
    cultivo: "soja",
    tipo: "enfermedad",
    estado: "no_evaluable",
    estadoReglaClimatica: "sin_regla",
    descripcion,
    ambiente: [ambiente],
    etapa,
    fuentes: [PATOGENOS],
  };
}

const PATOGENOS_TRIGO_VERIFICADOS: Record<string, Partial<FichaSanitaria>> = {
  "trigo-roya-amarilla": {
    estado: "en_validacion",
    estadoReglaClimatica: "pendiente_validacion",
    descripcion:
      "Enfermedad foliar cuya severidad depende del cultivar, nitrógeno e inóculo presentes en el lote.",
    ambiente: [
      "Temperaturas entre 10–15 °C, humedad elevada o lloviznas y al menos 6 horas de mojado.",
      "Temperaturas superiores a 20 °C inhiben su crecimiento.",
    ],
    etapa: "Macollaje a llenado de grano.",
    regiones: ["Región triguera; validar por subregión."],
    observar: ["Pústulas amarillas y evolución de síntomas en el lote."],
    observaciones: [
      "Prioridad de monitoreo: validar ventana, zona, umbral y acción antes de publicar una regla.",
      "Las condiciones ambientales no confirman presencia ni diagnóstico.",
    ],
    fuentes: [
      "F01 — SINAVIMO (SENASA), Puccinia striiformis: https://www.sinavimo.gob.ar/plaga/puccinia-striiformis",
    ],
  },
  "trigo-roya-hoja": {
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    descripcion:
      "Enfermedad relevante en Argentina; requiere diagnóstico y seguimiento en el lote.",
    ambiente: undefined,
    etapa: "Encañazón a llenado de grano.",
    regiones: ["Región triguera."],
    observar: ["Pústulas en hojas y comportamiento sanitario del cultivar."],
    observaciones: [
      "Solo monitoreo y diagnóstico: no hay un corte climático local validado para automatizar.",
    ],
    fuentes: [
      "F02 — INTA Marcos Juárez, Comportamiento sanitario de variedades de trigo.",
    ],
  },
  "trigo-roya-tallo": {
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    descripcion:
      "Enfermedad relevante en años favorables; requiere diagnóstico y evaluación del cultivar.",
    ambiente: undefined,
    etapa: "Encañazón a llenado de grano.",
    regiones: ["Región triguera."],
    observar: ["Pústulas en tallos y hojas, y su distribución en el lote."],
    observaciones: [
      "Solo monitoreo y diagnóstico: no hay una condición climática operativa documentada.",
    ],
    fuentes: [
      "F02 — INTA Marcos Juárez, Comportamiento sanitario de variedades de trigo.",
    ],
  },
  "trigo-mancha-amarilla": {
    estado: "en_validacion",
    estadoReglaClimatica: "pendiente_validacion",
    descripcion:
      "Enfermedad foliar asociada a rastrojo e inóculo presentes en el lote.",
    ambiente: [
      "El rastrojo y el inóculo son determinantes; no hay corte local validado.",
    ],
    etapa: "Macollaje a llenado de grano.",
    regiones: ["Región triguera."],
    observar: ["Lesiones foliares, rastrojo y antecedentes del lote."],
    observaciones: [
      "Prioridad de monitoreo desde macollaje; no crear una alerta meteorológica sin evidencia cuantitativa argentina.",
    ],
    fuentes: [
      "F02 — INTA Marcos Juárez, Comportamiento sanitario de variedades de trigo.",
      "F03 — SINAVIMO (SENASA), Pyrenophora tritici-repentis: https://www.sinavimo.gob.ar/plaga/pyrenophora-tritici-repentis",
    ],
  },
  "trigo-septoriosis": {
    estado: "en_validacion",
    estadoReglaClimatica: "pendiente_validacion",
    descripcion:
      "Patógeno asociado a residuos; la humedad y las lluvias orientan recorridas, no una predicción cerrada.",
    ambiente: [
      "Humedad elevada, mojado foliar y lluvias favorecen la dispersión.",
    ],
    etapa: "Macollaje a llenado de grano.",
    regiones: ["Región triguera."],
    observar: ["Manchas en hojas bajas, progresión y salpicado en el lote."],
    observaciones: [
      "Prioridad de monitoreo: no existe un umbral climático local validado.",
    ],
    fuentes: [
      "F02 — INTA Marcos Juárez, Comportamiento sanitario de variedades de trigo.",
    ],
  },
  "trigo-fusariosis-espiga": {
    estado: "en_validacion",
    estadoReglaClimatica: "pendiente_validacion",
    descripcion:
      "Enfermedad de espiga crítica por daño y micotoxinas; requiere corroborar la floración real del lote.",
    ambiente: [
      "Precipitaciones frecuentes y humedad relativa alta alrededor de antesis, con temperaturas templadas a cálidas.",
    ],
    etapa: "Espigazón a antesis.",
    regiones: ["Región pampeana y otras zonas."],
    observar: [
      "Espigas durante antesis, síntomas y antecedentes de fusariosis.",
    ],
    observaciones: [
      "Prioridad de monitoreo: validar una regla local antes de publicar; no trasladar modelos de otras regiones sin calibración.",
    ],
    fuentes: [
      "F04 — SINAVIMO (SENASA), Fusarium graminearum: https://www.sinavimo.gob.ar/plaga/fusarium-graminearum",
      "F05 — INTA Balcarce, Segundo informe sanitario trigo 2025.",
    ],
  },
  "trigo-fusariosis-corona": {
    estado: "en_validacion",
    estadoReglaClimatica: "pendiente_validacion",
    ambiente: [
      "Temperaturas entre 20–28 °C y baja humedad o estrés hídrico post-antesis.",
    ],
    etapa: "Posantesis a madurez.",
    regiones: ["Zona a relevar."],
    observaciones: [
      "Prioridad de monitoreo: validar ventana y condiciones antes de publicar una regla.",
    ],
    fuentes: [
      "F06 — SINAVIMO (SENASA), Fusarium pseudograminearum: https://www.sinavimo.gob.ar/plaga/fusarium-pseudograminearum",
    ],
  },
  "trigo-mancha-marron": {
    estado: "no_evaluable",
    estadoReglaClimatica: "sin_regla",
    ambiente: undefined,
    etapa: "Macollaje a llenado de grano.",
    regiones: ["Zona a relevar."],
    observaciones: [
      "El Excel indica no incorporar una regla al MVP sin validación meteorológica específica.",
    ],
    fuentes: [
      "F02 — INTA Marcos Juárez, Comportamiento sanitario de variedades de trigo.",
    ],
  },
  "trigo-tizon-bacteriano": {
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    ambiente: undefined,
    etapa: "Vegetativo a espigazón.",
    regiones: ["Zona a relevar."],
    observaciones: [
      "Solo monitoreo y diagnóstico: no existe una regla climática automática documentada.",
    ],
    fuentes: [
      "F02 — INTA Marcos Juárez, Comportamiento sanitario de variedades de trigo.",
    ],
  },
  "trigo-mal-rio-cuarto": {
    estado: "en_validacion",
    estadoReglaClimatica: "pendiente_validacion",
    ambiente: [
      "La situación está regulada por el vector, su densidad y los hospedantes.",
    ],
    etapa: "Emergencia a macollaje.",
    regiones: ["Centro-sur de Córdoba y zonas a validar."],
    observaciones: [
      "Prioridad de monitoreo: reforzar vigilancia regional, malezas hospedantes y presencia del vector; no usar el clima por sí solo.",
    ],
    fuentes: [
      "F07 — SINAVIMO (SENASA), Mal de Río Cuarto Virus: https://www.sinavimo.gob.ar/plaga/mal-de-rio-cuarto-virus",
    ],
  },
};

function patogenoTrigo(
  id: string,
  nombre: string,
  cientifico: string,
  descripcion: string,
  ambiente: string,
  etapa: string,
  fuentes: string[],
  observar: string[],
): FichaSanitaria {
  const verificado = PATOGENOS_TRIGO_VERIFICADOS[id];
  return {
    id,
    nombre,
    cientifico,
    cultivo: "trigo",
    tipo: "enfermedad",
    estado: "en_validacion",
    estadoReglaClimatica: "experimental",
    descripcion,
    ambiente: [ambiente],
    etapa,
    observar,
    observaciones: [
      "Evaluación experimental: las condiciones climáticas no confirman infección ni presencia en el lote.",
      "Mojado foliar, inóculo y observación a campo permanecen fuera de la evaluación climática.",
    ],
    ...verificado,
    fuentes: [
      "Natali — Patógenos del trigo y condiciones ambientales (VERIFICADO)",
      ...(verificado?.fuentes ?? fuentes),
    ],
  };
}

function plagaTrigo(
  ficha: Omit<FichaSanitaria, "cultivo" | "tipo">,
): FichaSanitaria {
  return {
    ...ficha,
    cultivo: "trigo",
    tipo: "plaga",
    fuentes: [
      "Natali — Plagas del trigo y condiciones ambientales (VERIFICADO)",
      ...ficha.fuentes,
    ],
  };
}

export const FICHAS_SANITARIAS: FichaSanitaria[] = [
  plaga(
    "trips",
    "Trips",
    "Caliothrips phaseoli",
    "Raspan la hoja y destruyen la capa cerosa; las ninfas causan mayor daño.",
    "Ambientes cálidos y sequía prolongada; humedad y temperaturas templadas favorecen hongos que los controlan.",
    "V tardío a R; efecto relevante entre R3 y R5.5 (a validar).",
    "Núcleo y Centro (frecuente); resto variable.",
    ["SINAVIMO", "INTA Marcos Juárez (2021 y 2024)", "INTA Santa Fe (2025)"],
    "en_validacion",
    "pendiente_validacion",
    ["Puntos negros de excrementos y trips en folíolos del estrato inferior."],
    [
      "La propuesta climática del archivo está pendiente de validación de Natali.",
    ],
  ),
  plaga(
    "aranuela",
    "Arañuela roja",
    "Tetranychus urticae",
    "Forma colonias en el envés de hojas inferiores y bordes del lote; puede producir telilla y punteado clorótico.",
    "Óptimo documentado de 30–32 °C; se favorece con tiempo seco y baja humedad relativa.",
    "Todo el ciclo; foco en V tardío a R y mayor efecto en R3–R5.5 (a validar).",
    "Núcleo y Centro (frecuente); resto variable.",
    ["INTA Marcos Juárez", "Aapresid (2025)"],
    "en_validacion",
    "pendiente_validacion",
    ["Colonias, telilla y punteado clorótico en el envés de hojas."],
    [
      "El criterio climático del archivo está pendiente de definición y validación.",
    ],
  ),
  plaga(
    "chinches",
    "Complejo de chinches",
    "Nezara viridula, Piezodorus guildinii, Dichelops furcatus y Edessa meditabunda",
    "Dañan vainas y granos; la documentación identifica a P. guildinii como la especie de mayor daño.",
    "El archivo indica mayor proliferación con humedad alta, sin una regla climática.",
    "R3–R6; más sensible entre R3 y R5.",
    "Norte y centro; mayor presión en Litoral y menor en sudeste de Buenos Aires.",
    ["Aapresid", "INTA Santa Fe (2025)"],
    "informacion",
    "sin_regla",
    ["Identificar especies y realizar recuentos con paño vertical."],
    ["Natali: la chinche verde es una plaga clave en soja."],
  ),
  plaga(
    "oruga-medidora",
    "Oruga medidora",
    "Rachiplusia nu",
    "Es migratoria y defoliadora; la documentación indica supervivencia y daño en soja Bt.",
    "Temperaturas de 25–30 °C son favorables; el efecto de humedad es ambiguo por el control de hongos.",
    "V a R5; período sensible indicado: R3–R6.",
    "Todo el país; menor presencia hacia el sur.",
    ["SINAVIMO", "EEAOC (2023)", "INTA Marcos Juárez"],
    "informacion",
    "sin_regla",
    ["Defoliación y larvas en un monitoreo representativo."],
  ),
  plaga(
    "oruga-leguminosas",
    "Oruga de las leguminosas",
    "Anticarsia gemmatalis",
    "Oruga migratoria que daña principalmente soja no Bt.",
    "Los períodos húmedos pueden reducirla por acción del hongo Nomuraea rileyi.",
    "V a R5; período sensible indicado: R3–R6.",
    "Todo el país; menor presencia hacia el sur.",
    ["INTA Marcos Juárez", "EEAOC (2019)"],
    "informacion",
    "sin_regla",
    ["Defoliación y larvas en el lote."],
  ),
  plaga(
    "falsa-medidora",
    "Falsa medidora",
    "Chrysodeixis includens",
    "Es parte del complejo defoliador; la fuente reporta una participación alta en Tucumán.",
    undefined,
    "V a R5; período sensible indicado: R3–R6.",
    "NOA y NEA (frecuente); Córdoba, Santa Fe, Entre Ríos y detecciones en Buenos Aires.",
    ["EEAOC (2019)"],
    "informacion",
    "sin_regla",
    ["Defoliación y larvas en el lote."],
  ),
  plaga(
    "bolillera",
    "Oruga bolillera",
    "Helicoverpa gelotopoeon",
    "Ataca brotes, flores y vainas; son relevantes la presencia, densidad y tamaño de larvas.",
    "El archivo registra un indicio de aumento en años secos (Niña), sin regla climática.",
    "R3–R6; también puede afectar el stand de plantas.",
    "NOA, NEA, Litoral, Núcleo y Centro.",
    ["INTA Marcos Juárez (2024)", "INTA Pergamino"],
    "informacion",
    "sin_regla",
    ["Larvas y daños en brotes, flores y vainas."],
    ["Natali: también es una plaga de suelo durante la implantación."],
  ),
  plaga(
    "complejo-spodoptera",
    "Complejo Spodoptera",
    "Spodoptera cosmioides y S. frugiperda",
    "Orugas grandes y voraces que atacan hojas y vainas.",
    "Altas temperaturas para S. cosmioides; la referencia de clima lluvioso está indicada como fuente débil.",
    "R3–R6; también puede afectar el stand de plantas.",
    "NOA y NEA (frecuente); resto variable.",
    ["INTA (Aragón)", "La Gaceta (2021, cita REM)"],
    "informacion",
    "sin_regla",
    ["Larvas de al menos 1,5 cm mediante paño vertical."],
  ),
  plaga(
    "picudo-negro-vaina",
    "Picudo negro de la vaina",
    "Rhyssomatus subtilis",
    "Ovipone dentro de la vaina; la larva consume el grano y luego se entierra.",
    "Las lluvias aumentan la salida de adultos desde el suelo.",
    "R3–R6; oviposición entre R5 y R6, y también en implantación.",
    "NOA (frecuente), NEA; emergente en Centro y Litoral.",
    ["UNT (Cazado, 2024)", "INTA citado en prensa (2025–2026)"],
    "informacion",
    "sin_regla",
    ["Adultos y daño en vainas."],
    ["Natali: también afecta brotes y tiene hábitos nocturnos."],
  ),
  plaga(
    "barrenador-menor-tallo",
    "Barrenador menor del tallo / gusano saltarín",
    "Elasmopalpus lignosellus",
    "La larva perfora la base del tallo, mata plántulas y puede debilitar o volcar plantas.",
    "Altas temperaturas, sequía prolongada, suelo seco o arenoso y siembras tardías.",
    "VE–V3; mayor gravedad entre VE y V1.",
    "Núcleo y Centro (Santa Fe y Córdoba); resto a relevar.",
    ["SINAVIMO", "INTA Oliveros (2010)"],
    "en_validacion",
    "experimental",
    ["Plántulas cortadas o tallos perforados durante implantación."],
    ["Candidata a regla climática en emergencia; cortes a definir con Natali."],
  ),
  plaga(
    "barrenador-brote",
    "Barrenador del brote",
    "Crocidosema (Epinotia) aporema",
    "Daña brotes terminales y vainas en formación.",
    undefined,
    "V y R tempranos.",
    "Región pampeana central; resto a relevar.",
    ["INTA (Aragón)"],
    "informacion",
    "sin_regla",
    ["Brotes terminales y vainas en formación."],
  ),
  plaga(
    "mosca-barrenadora-tallo",
    "Mosca barrenadora del tallo",
    "Melanagromyza sojae",
    "Larvas y pupas se alojan dentro de tallos y pecíolos; es una plaga nueva en Argentina desde 2019.",
    "Condiciones cálidas, lluvias y humedad elevada por encima de 70 % (documentado).",
    "Primeras cuatro semanas desde la siembra.",
    "NOA (Tucumán), Santa Fe, Entre Ríos y Córdoba.",
    ["EEAOC (2020)"],
    "informacion",
    "sin_regla",
    ["Daños en tallos y pecíolos durante las primeras semanas."],
  ),
  plaga(
    "orugas-cortadoras",
    "Orugas cortadoras",
    "Agrotis spp. y otras",
    "Cortan plántulas a nivel del suelo.",
    "El archivo registra un indicio de más daño en años secos (Niña).",
    "VE–V3.",
    "A relevar.",
    ["INTA Marcos Juárez (2024)"],
    "en_validacion",
    "sin_regla",
    ["Plántulas cortadas durante implantación."],
    ["Registro agregado a confirmar."],
  ),
  plaga(
    "babosas-bicho-bolita",
    "Babosas y bicho bolita",
    "Milax gagates y Armadillidium vulgare",
    "Consumen cotiledones y plántulas y pueden provocar pérdida de plantas.",
    "Siembra directa con rastrojo; la relación con humedad y lluvias figura como pendiente de confirmación.",
    "VE–V2.",
    "Sudeste bonaerense; resto a relevar.",
    ["INTA Balcarce / FCA-UNMdP (2014)"],
    "en_validacion",
    "sin_regla",
    ["Daño en cotiledones y plántulas."],
    ["Registro agregado a confirmar."],
  ),
  ...[
    [
      "antracnosis",
      "Antracnosis",
      "Colletotrichum truncatum / C. gloeosporioides",
      "Afecta vainas, tallos y pecíolos; sobrevive en rastrojo e infecta desde semilla.",
      "25–30 °C, humedad elevada, mojado foliar prolongado y lluvia.",
      "V0–R7; relevancia indicada entre R3 y R4.",
    ],
    [
      "muerte-subita",
      "Síndrome de muerte súbita",
      "Fusarium tucumaniae / F. virguliforme",
      "Asociado a suelos compactados o con mal drenaje y presencia de nemátodos.",
      "Condiciones templadas o frescas al inicio, con alta humedad o saturación del suelo.",
      "V0–R7.",
    ],
    [
      "phytophthora",
      "Podredumbre del tallo y de la raíz",
      "Phytophthora sojae",
      "Enfermedad de suelo; las zoosporas se desplazan en agua libre.",
      "25–30 °C y suelos saturados o inundados.",
      "V0–R7.",
    ],
    [
      "damping-off",
      "Damping off",
      "Pythium",
      "Información agronómica documentada para enfermedades de implantación.",
      "10–36 °C y anegamiento.",
      "V0–R7.",
    ],
    [
      "fusarium",
      "Fusarium",
      "Fusarium spp.",
      "Se documenta en ambientes de alto potencial, suelos húmedos, con mal drenaje o saturados.",
      "20–25 °C y humedad relativa mayor a 80 %.",
      "V0–R7.",
    ],
    [
      "mancha-marron",
      "Mancha marrón",
      "Septoria glycines (teleomorfo Mycosphaerella uspenskajae)",
      "El hongo sobrevive en rastrojo; se documentan lluvias frecuentes.",
      "25–30 °C y mojado foliar de 6 a 36 horas.",
      "V1–R7.",
    ],
    [
      "tizon-hoja-mancha-purpura",
      "Tizón de la hoja y mancha púrpura de la semilla",
      "Cercospora kikuchii",
      "Sobrevive en rastrojo y semilla; se favorece en períodos húmedos y cálidos.",
      "23–28 °C y humedad relativa alta prolongada.",
      "V1–R7.",
    ],
    [
      "complejo-fin-ciclo",
      "Complejo de hongos de fin de ciclo",
      "Cercospora, Septoria y Colletotrichum",
      "Favorecido por precipitaciones constantes en etapas reproductivas.",
      "20–30 °C y humedad ambiental elevada.",
      "V1–R7; énfasis R3–R6.",
    ],
    [
      "roya-asiatica",
      "Roya asiática de la soja",
      "Phakopsora pachyrhizi",
      "Requiere hospedantes alternativos y se disemina por viento a largas distancias.",
      "Humedad relativa mayor a 75–80 %, mojado foliar de al menos 6 horas y precipitaciones.",
      "No documentado en el archivo.",
    ],
    [
      "esclerotinia",
      "Podredumbre húmeda del tallo / capítulo",
      "Sclerotinia sclerotiorum",
      "El canopeo cerrado genera microclima húmedo; forma esclerotos en suelo y rastrojo.",
      "10–28 °C, alta humedad, humedad de suelo, mojado persistente, lluvia y viento.",
      "R2–R3 en tallo; R5 en capítulo.",
    ],
    [
      "podredumbre-marron-tallo",
      "Podredumbre marrón del tallo",
      "Cadophora gregata",
      "Información agronómica documentada para enfermedad de tallo.",
      "17–27 °C y alta humedad del suelo.",
      "R1–R7.",
    ],
    [
      "podredumbre-carbonosa",
      "Podredumbre carbonosa de raíz y tallo",
      "Macrophomina phaseolina",
      "Favorecida por estrés hídrico y térmico prolongado; sobrevive como microesclerotos.",
      "Temperaturas mayores a 30 °C, humedad relativa cercana a 40 % y sequía.",
      "VC–R6.",
    ],
    [
      "tizon-sclerotium",
      "Tizón por Sclerotium",
      "Sclerotium rolfsii",
      "Se documenta para clima tropical, suelos arenosos aireados y alta humedad.",
      "30–35 °C y humedad alta.",
      "No documentado en el archivo.",
    ],
    [
      "rhizoctonia",
      "Podredumbre de la raíz por Rhizoctonia",
      "Rhizoctonia solani",
      "Información agronómica documentada para enfermedad de raíz.",
      "26–32 °C de suelo y suelo seco.",
      "VC.",
    ],
    [
      "cancro-tallo-meridionalis",
      "Cancro del tallo",
      "Diaporthe phaseolorum var. meridionalis",
      "Los primeros síntomas se indican 15–20 días luego de la infección.",
      "25–30 °C, lluvia y viento.",
      "R1–R7.",
    ],
    [
      "cancro-tallo-caulivora",
      "Cancro del tallo",
      "Diaporthe phaseolorum var. caulivora",
      "La infección puede ocurrir temprano y los síntomas aparecer durante el llenado de grano; sobrevive en rastrojo.",
      "20–25 °C, alta humedad y lluvias frecuentes en vegetativo.",
      "R1–R7.",
    ],
    [
      "mancha-ojo-rana",
      "Mancha ojo de rana",
      "Cercospora sojina",
      "Información agronómica documentada para enfermedad foliar.",
      "25–35 °C, lluvias abundantes, rocío y humedad relativa superior a 90 %.",
      "V1–R7.",
    ],
    [
      "tizon-bacteriano",
      "Tizón bacteriano",
      "Pseudomonas syringae pv. glycinea (sin. Pseudomonas savastanoi pv. glycinea)",
      "La bacteria necesita lesiones para penetrar.",
      "Temperaturas frescas asociadas a tormentas de lluvia con viento o granizo.",
      "No documentado en el archivo.",
    ],
    [
      "pustula-bacteriana",
      "Pústula bacteriana",
      "Xanthomonas axonopodis pv. glycines (sin. Xanthomonas campestris pv. glycines)",
      "La bacteria necesita lesiones para penetrar.",
      "Temperaturas cálidas asociadas a tormentas de lluvia con viento o granizo.",
      "No documentado en el archivo.",
    ],
    [
      "mosaico-comun-soja",
      "Virus del mosaico común de la soja (SMV)",
      undefined,
      "La documentación indica áfidos y viento.",
      "No documentado en el archivo.",
      "No documentado en el archivo.",
    ],
    [
      "mosaico-alfalfa",
      "Virus del mosaico de la alfalfa (AMV)",
      undefined,
      "La documentación indica áfidos y viento.",
      "No documentado en el archivo.",
      "No documentado en el archivo.",
    ],
    [
      "oidio",
      "Oídio",
      "Erysiphe diffusa (sin. Microsphaera diffusa)",
      "La información ambiental documentada indica que se detiene a los 30 °C.",
      "18–24 °C y humedad alta.",
      "No documentado en el archivo.",
    ],
    [
      "mildiu",
      "Mildiu",
      "Peronospora manshurica",
      "Información agronómica documentada para enfermedad foliar.",
      "20–22 °C y humedad alta.",
      "R1–R7.",
    ],
  ].map(([id, nombre, cientifico, descripcion, ambiente, etapa]) =>
    patogeno(
      id as string,
      nombre as string,
      cientifico as string | undefined,
      descripcion as string,
      ambiente as string,
      etapa as string,
    ),
  ),
  plagaTrigo({
    id: "trigo-pulgon-verde-cereales",
    nombre: "Pulgón verde de los cereales",
    cientifico: "Schizaphis graminum",
    estado: "en_validacion",
    estadoReglaClimatica: "pendiente_validacion",
    descripcion:
      "Insecto chupador cuya saliva tóxica puede dañar plántulas y transmitir virus.",
    ambiente: [
      "Tiempo seco y temperaturas inferiores a 20 °C; las heladas no necesariamente reducen su presencia.",
    ],
    observar: [
      "Colonias en plántulas y síntomas de daño; corroborar la presencia a campo.",
    ],
    etapa: "Emergencia a encañazón.",
    regiones: ["Algunas áreas argentinas."],
    observaciones: [
      "La propuesta del Excel sólo eleva la prioridad de monitoreo: no infiere presencia.",
      "Pendiente de validación IA para umbral, ventana, zona y recomendación.",
    ],
    fuentes: [
      "F01 — SINAVIMO (SENASA), Schizaphis graminum: https://www.sinavimo.gob.ar/plaga/schizaphis-graminum",
      "F02 — INTA Reconquista, Insectos en el cultivo de trigo, guía ilustrada.",
    ],
  }),
  plagaTrigo({
    id: "trigo-pulgon-ruso",
    nombre: "Pulgón ruso",
    cientifico: "Diuraphis noxia",
    estado: "en_validacion",
    estadoReglaClimatica: "pendiente_validacion",
    descripcion:
      "Puede enrollar hojas, afectar espigas y adquirir mayor importancia durante primaveras secas.",
    ambiente: [
      "Períodos secos y temperaturas templadas, sin un corte local documentado.",
    ],
    observar: ["Enrollamiento de hojas, colonias y daño en espigas."],
    etapa: "Macollaje a precosecha.",
    regiones: ["Región triguera; validar la presión local."],
    observaciones: [
      "El Excel propone reforzar el monitoreo en períodos secos y templados; no es una regla climática.",
      "Pendiente de validación IA para umbral, ventana, zona y recomendación.",
    ],
    fuentes: [
      "F03 — SINAVIMO (SENASA), Diuraphis noxia: https://www.sinavimo.gob.ar/plaga/diuraphis-noxia",
    ],
  }),
  plagaTrigo({
    id: "trigo-pulgon-avena",
    nombre: "Pulgón de la avena",
    cientifico: "Rhopalosiphum padi",
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    descripcion:
      "Plaga chupadora con potencial de transmitir virus; requiere seguimiento de colonias y del cultivo.",
    observar: ["Colonias, daño en hojas y síntomas compatibles con virosis."],
    etapa: "Macollaje a espigazón.",
    observaciones: [
      "Solo monitoreo: el Excel no documenta una condición climática operativa.",
    ],
    fuentes: [
      "F02 — INTA Reconquista, Insectos en el cultivo de trigo, guía ilustrada.",
      "F04 — INTA Balcarce, Controladores biológicos de pulgones e isocas del trigo.",
    ],
  }),
  plagaTrigo({
    id: "trigo-pulgon-espiga",
    nombre: "Pulgón de la espiga",
    cientifico: "Sitobion avenae",
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    descripcion: "Coloniza espigas y puede afectar el llenado de grano.",
    observar: ["Colonias en espigas durante el llenado de grano."],
    etapa: "Espigazón a llenado de grano.",
    observaciones: [
      "Solo monitoreo: el Excel no documenta una condición climática operativa.",
    ],
    fuentes: [
      "F02 — INTA Reconquista, Insectos en el cultivo de trigo, guía ilustrada.",
      "F04 — INTA Balcarce, Controladores biológicos de pulgones e isocas del trigo.",
    ],
  }),
  plagaTrigo({
    id: "trigo-isoca-militar-verdadera",
    nombre: "Isoca militar verdadera",
    cientifico: "Mythimna adultera (= Pseudaletia adultera)",
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    descripcion:
      "Oruga defoliadora que puede afectar la formación y el llenado de grano.",
    observar: ["Larvas y defoliación desde encañazón hasta llenado."],
    etapa: "Encañazón a llenado de grano.",
    regiones: ["Región triguera."],
    observaciones: [
      "Solo monitoreo: el Excel no documenta una condición climática operativa.",
    ],
    fuentes: [
      "F05 — Referencia citada en el Excel sin detalle bibliográfico disponible.",
    ],
  }),
  plagaTrigo({
    id: "trigo-oruga-desgranadora",
    nombre: "Oruga desgranadora",
    cientifico: "Helicoverpa gelotopoeon",
    estado: "no_evaluable",
    estadoReglaClimatica: "sin_regla",
    descripcion:
      "Puede afectar estructuras reproductivas; la identificación de especie y daño debe confirmarse a campo.",
    observar: ["Daño en espigas y granos durante la etapa reproductiva."],
    etapa: "Espigazón a llenado de grano.",
    observaciones: [
      "El Excel indica no incorporarla al MVP sin validación específica para trigo.",
      "No hay evidencia climática específica para automatizar una regla.",
    ],
    fuentes: [
      "F04 — INTA Balcarce, Controladores biológicos de pulgones e isocas del trigo.",
    ],
  }),
  plagaTrigo({
    id: "trigo-gusanos-blancos",
    nombre: "Gusanos blancos",
    cientifico: "Diloboderus abderus y otros Scarabaeidae",
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    descripcion:
      "Las larvas pueden dañar raíces, semillas y plántulas del trigo.",
    observar: ["Muestreo de suelo e historial del lote antes de la siembra."],
    etapa: "Siembra a emergencia.",
    regiones: ["Región triguera."],
    observaciones: [
      "Solo monitoreo y diagnóstico a campo: no hay una regla meteorológica común documentada.",
    ],
    fuentes: [
      "F04 — INTA Balcarce, Controladores biológicos de pulgones e isocas del trigo.",
    ],
  }),
  plagaTrigo({
    id: "trigo-orugas-cortadoras",
    nombre: "Orugas cortadoras",
    cientifico: "Agrotis spp. y Peridroma spp.",
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    descripcion: "Cortan plántulas a nivel del suelo durante la implantación.",
    observar: ["Muestreo de suelo y bordes del lote; plántulas cortadas."],
    etapa: "Siembra a emergencia.",
    regiones: ["Región triguera."],
    observaciones: [
      "Solo monitoreo y diagnóstico a campo: no hay una regla meteorológica única documentada.",
    ],
    fuentes: [
      "F04 — INTA Balcarce, Controladores biológicos de pulgones e isocas del trigo.",
    ],
  }),
  plagaTrigo({
    id: "trigo-trips",
    nombre: "Trips",
    cientifico: "Thripidae spp.",
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    descripcion:
      "Puede causar daño durante las primeras etapas del cultivo; la evidencia climática específica está pendiente.",
    observar: ["Presencia de trips y daño en plántulas."],
    etapa: "Emergencia a macollaje.",
    regiones: ["Norte de Santa Fe y otras zonas a validar."],
    observaciones: [
      "Solo monitoreo: el Excel no documenta una condición climática operativa.",
    ],
    fuentes: [
      "F02 — INTA Reconquista, Insectos en el cultivo de trigo, guía ilustrada.",
    ],
  }),
  plagaTrigo({
    id: "trigo-chinches",
    nombre: "Chinches",
    cientifico: "Nezara viridula y otras Pentatomidae",
    estado: "informacion",
    estadoReglaClimatica: "sin_regla",
    descripcion:
      "Puede afectar espigas y granos; se requiere identificación y monitoreo a campo.",
    observar: ["Presencia y daño en espigas y granos."],
    etapa: "Espigazón a llenado de grano.",
    observaciones: [
      "Solo monitoreo: el Excel no documenta una condición climática operativa ni evidencia por especie o zona.",
    ],
    fuentes: [
      "F02 — INTA Reconquista, Insectos en el cultivo de trigo, guía ilustrada.",
    ],
  }),
  patogenoTrigo(
    "trigo-roya-amarilla",
    "Roya amarilla",
    "Puccinia striiformis f. sp. tritici",
    "Enfermedad foliar del trigo; la presencia requiere tejido susceptible e inóculo.",
    "Desarrollo de referencia entre 10–16 °C; la germinación se documenta entre 7–15 °C y requiere agua libre.",
    "Macollaje a llenado de grano.",
    ["UGA Extension, Stripe Rust of Wheat (C960)", "SINAVIMO"],
    ["Pústulas amarillas en hojas y evolución de los síntomas en el lote."],
  ),
  patogenoTrigo(
    "trigo-roya-hoja",
    "Roya de la hoja",
    "Puccinia triticina",
    "Enfermedad foliar cuya expresión depende de inóculo y susceptibilidad varietal.",
    "Referencia ambiental: 15–22 °C y humedad libre; el mojado foliar no está medido por Avizor.",
    "Encañazón a llenado de grano.",
    ["New Mexico State University, Leaf, Stem, and Stripe Rust Diseases"],
    ["Pústulas en hojas, distribución en el lote y antecedentes varietales."],
  ),
  patogenoTrigo(
    "trigo-roya-tallo",
    "Roya del tallo",
    "Puccinia graminis f. sp. tritici",
    "Enfermedad que puede afectar tallos y hojas cuando hay tejido susceptible e inóculo.",
    "Óptimo de referencia entre 18–30 °C y humedad libre; no se observa mojado foliar prolongado.",
    "Encañazón a llenado de grano.",
    ["New Mexico State University, Leaf, Stem, and Stripe Rust Diseases"],
    ["Pústulas en tallos y hojas, y su distribución en el lote."],
  ),
  patogenoTrigo(
    "trigo-mancha-amarilla",
    "Mancha amarilla",
    "Pyrenophora tritici-repentis",
    "Enfermedad foliar asociada a rastrojo e inóculo presente en el lote.",
    "La bibliografía cita períodos húmedos dependientes de la temperatura; el rango 10–30 °C es sólo referencia, no una regla binaria.",
    "Desde embuchado a grano pastoso.",
    ["University of Nebraska–Lincoln, Tan Spot of Wheat (G429)"],
    ["Lesiones foliares, rastrojo y antecedentes del lote."],
  ),
  patogenoTrigo(
    "trigo-septoriosis",
    "Septoriosis",
    "Zymoseptoria tritici",
    "Enfermedad foliar cuya infección requiere inóculo y períodos de humedad o mojado.",
    "Referencia ambiental: 16–25 °C y alrededor de 6 horas de mojado; neblina o llovizna no equivalen a mojado foliar.",
    "Macollaje a llenado de grano.",
    ["UC IPM, Septoria tritici blotch of wheat"],
    ["Manchas en hojas bajas, progresión y salpicado en el lote."],
  ),
  patogenoTrigo(
    "trigo-fusariosis-espiga",
    "Fusariosis de la espiga",
    "Fusarium graminearum species complex",
    "Enfermedad de espiga que requiere floración confirmada, inóculo y condiciones de humedad.",
    "La bibliografía cita alta humedad durante floración y 25–30 °C; la lluvia sola no confirma una condición de infección.",
    "Floración (Z60–69).",
    ["UGA Extension, Wheat Production Guide; Fusarium head blight"],
    ["Espigas durante floración, síntomas y antecedentes de fusariosis."],
  ),
  patogenoTrigo(
    "trigo-fusariosis-corona",
    "Fusariosis de corona",
    "Fusarium pseudograminearum",
    "Puede producir espigas blancas y grano vano; no debe confundirse con fusariosis de la espiga.",
    "Condiciones ambientales documentadas en la ficha de revisión.",
    "Posantesis a madurez.",
    ["F06 — SINAVIMO (SENASA), Fusarium pseudograminearum."],
    ["Espigas blancas, grano vano y síntomas de corona."],
  ),
  patogenoTrigo(
    "trigo-mancha-marron",
    "Mancha marrón",
    "Bipolaris sorokiniana",
    "Enfermedad que se mantiene como información de diagnóstico mientras falta una regla meteorológica específica validada.",
    "Condiciones ambientales a relevar.",
    "Macollaje a llenado de grano.",
    [
      "F02 — INTA Marcos Juárez, Comportamiento sanitario de variedades de trigo.",
    ],
    ["Síntomas foliares y antecedentes del lote."],
  ),
  patogenoTrigo(
    "trigo-tizon-bacteriano",
    "Tizón bacteriano",
    "Pseudomonas syringae pv. syringae",
    "Enfermedad relevante en algunos años; requiere monitoreo y diagnóstico a campo.",
    "Condiciones ambientales a relevar.",
    "Vegetativo a espigazón.",
    [
      "F02 — INTA Marcos Juárez, Comportamiento sanitario de variedades de trigo.",
    ],
    ["Síntomas compatibles y distribución en el lote."],
  ),
  patogenoTrigo(
    "trigo-mal-rio-cuarto",
    "Mal de Río Cuarto",
    "MRCV; vector Delphacodes kuscheli",
    "Enfermedad viral cuya situación depende de la densidad del vector y de hospedantes.",
    "La condición ambiental no reemplaza la observación del vector.",
    "Emergencia a macollaje.",
    ["F07 — SINAVIMO (SENASA), Mal de Río Cuarto Virus."],
    ["Presencia del vector, malezas hospedantes y síntomas en el cultivo."],
  ),
];

export function filtrarFichas({
  cultivo,
  tipo,
  busqueda,
}: {
  cultivo: string;
  tipo: "todas" | TipoFicha;
  busqueda: string;
}) {
  const term = busqueda.trim().toLocaleLowerCase("es-AR");
  return FICHAS_SANITARIAS.filter(
    (ficha) =>
      ficha.cultivo === cultivo &&
      (tipo === "todas" || ficha.tipo === tipo) &&
      (!term ||
        [ficha.nombre, ficha.cientifico]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es-AR")
          .includes(term)),
  );
}
