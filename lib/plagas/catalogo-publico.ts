export type TipoFicha = "plaga" | "enfermedad";
export type EstadoFicha = "informacion" | "en_validacion" | "no_evaluable";
export type EstadoReglaClimatica =
  "sin_regla" | "pendiente_validacion" | "experimental" | "aprobada";

export interface FichaSanitaria {
  id: string;
  nombre: string;
  cientifico?: string;
  cultivo: "soja";
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
