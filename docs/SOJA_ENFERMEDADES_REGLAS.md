# Reglas ambientales para enfermedades de soja — Avizor v2.0

Fecha de normalización y consulta de fuentes: 2026-08-24. Fuente primaria: `patogenos_soja_condiciones_ambientales 14-08.xlsx`, elaborada/validada por Natali. El libro entregado contiene 23 filas agronómicas en una hoja visible; las definiciones expresas aportadas con el encargo (HR alta >90 %, HR elevada >80 %, mojado prolongado 12 h, fresco bacteriano 15–20 °C y cálido bacteriano 25–30 °C) se consideran parte de esa fuente primaria.

Avizor identifica condiciones ambientales compatibles; no confirma presencia, infección ni enfermedad. Toda regla activa debe mostrarse con una aclaración equivalente a: “Esta señal se basa en condiciones ambientales y no constituye un diagnóstico de presencia de enfermedad.”

## Modo Avizor

El modo es independiente de la evaluabilidad agronómica. Una regla `EXPERIMENTAL` puede detectar y registrar coincidencias ambientales para admin, logs y QA, pero no participa del `ScoreEngineV2`, no modifica `estado_general` y no debe mostrarse como alerta pública estándar.

| Modo | Reglas v2.0 | Participa del estado general |
|---|---|---|
| ESTABLE | Cercospora kikuchii, Roya asiática, Macrophomina, Oídio, Mildiu | Sí |
| EXPERIMENTAL | Antracnosis, Sclerotinia, Mancha ojo de rana, Tizón bacteriano, Pústula bacteriana | No |

Todas continúan siendo `PARCIALMENTE_EVALUABLE`. En `reglas_agronomicas`, el modo reutiliza el campo nativo `estado`: `vigente` equivale a ESTABLE y `experimental` a EXPERIMENTAL. `estado_regla` queda como `experimental` para las diez implementaciones parciales, evitando afirmar validación integral. `validado_por` documenta por separado “Fuente agronómica: Natali; normalización técnica parcial: Avizor”, y `validado_en` permanece nulo.

## Inventario previo

- Reglas v2 vigentes encontradas: `enfermedades_foliares` (5 días), `temperatura_bajo_umbral` (3), `baja_precipitacion` (14) y `precipitacion_elevada` (7). Las reglas legacy quedaron retiradas por la migración 007.
- `RulesEngineV2` evalúa niveles declarativos, combinación `all`, operadores seguros y cobertura; `ScoreEngineV2` no suma pesos: una o más señales activas producen “Atención recomendada”.
- La fenología se estima, pero hoy se calcula después de las reglas y contractualmente `modifica_reglas: false`.
- Variables diarias: temperatura de aire media/mínima/máxima, HR, precipitación, viento, punto de rocío, VPD, evapotranspiración, ET₀, radiación, humedad de suelo a 0–1/1–3/3–9/9–27/27–81 cm y temperatura de suelo a 0/6/18/54 cm.
- Faltan: mojado foliar observado, rocío observado, granizo/lesiones, vectores, drenaje, compactación, textura, rastrojo, inóculo y calibración suelo–saturación. Los valores faltantes permanecen `null` y causan `indeterminado` cuando son obligatorios.

## Matriz técnica

Abreviaturas: T=temperatura de aire; Ts=temperatura de suelo; HR=humedad relativa; P=precipitación; MF=mojado foliar; HS=humedad de suelo; EH=estrés hídrico; V=viento; C=complementaria; O=obligatoria en la señal activa. “—” significa que Natali no lo especifica, no que el factor sea falso.

| Categoría | Enfermedad | Nombre científico | T | Ts | HR | P | MF | HS | EH | V | Fenología | Ventana | O / C | No observable | Evaluabilidad / cobertura | Fuente Natali | Fuente institucional | Decisión Avizor |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fin de ciclo | Antracnosis | *C. truncatum / C. gloeosporioides* | 25–30 | — | ≥85 | lluvia | 12 h | — | — | — | V0–R7; prioridad R3–R4 | 5 d | O:T+HR; C:P/MF/fenología | MF, rastrojo, inóculo | PARCIAL / PARCIAL | fila Excel | INTA diagnóstico y tratamiento | Activa v2.0; sin afirmar infección |
| Raíz | Muerte súbita | *F. tucumaniae / F. virguliforme* | templada/fresca inicial | — | ≥85 | — | — | saturada | — | — | V0–R7 | — | esenciales: suelo+contexto | saturación, drenaje, compactación, nematodos | NO_EVALUABLE / INSUFICIENTE | fila Excel | UMN SDS | Catálogo; no activa |
| Raíz/tallo | Phytophthora | *P. sojae* | 25–30 | — | — | — | — | saturada/inundada | — | — | V0–R7 | — | esencial: saturación | saturación calibrada, inundación, drenaje | NO_EVALUABLE / INSUFICIENTE | fila Excel | INTA lluvias/enfermedades | Catálogo; lluvia aislada no equivale a saturación |
| Plántula | Damping-off | *Pythium spp.* | 10–36 | — | — | — | — | anegada | — | — | V0–R7 | — | esencial: anegamiento | anegamiento/saturación | NO_EVALUABLE / INSUFICIENTE | fila Excel | INTA lluvias/enfermedades | Catálogo; rango térmico no basta |
| Raíz | Fusarium | *Fusarium spp.* | 20–25 | — | ≥85 | — | — | húmeda/saturada | — | — | V0–R7 | — | esencial: suelo | saturación, drenaje, estrés | NO_EVALUABLE / INSUFICIENTE | fila Excel | Crop Protection Network (CPN) | Catálogo; HR no sustituye HS |
| Foliar | Mancha marrón | *Septoria glycines* | 25–30; ópt. 28 | — | — | frecuente | 6–36 h | — | — | — | V1–R7 | pendiente | O:P frecuente+MF; C:T | MF, rastrojo, inóculo | PARCIAL / PARCIAL | fila Excel | UMN Septoria | Catalogada; no activa hasta formalizar lluvia frecuente sin inventar umbral |
| Fin de ciclo | Tizón/Mancha púrpura | *C. kikuchii* | 23–28 | — | ≥85 persistente | — | — | — | — | — | V1–R7 | 5 d | O:T+HR 4/5 d | rastrojo, semilla, inóculo | PARCIAL / PARCIAL | fila Excel | INTA semillas de soja | Activa |
| Fin de ciclo | Complejo EFC | *Cercospora/Septoria/Colletotrichum* | 20–30 | — | ≥85 | constante | — | — | — | — | R3–R6 | — | agregación, no enfermedad única | MF, inóculo | NO_EVALUABLE / INSUFICIENTE | fila Excel | INTA lluvias/enfermedades | Catálogo; no activa para evitar doble conteo |
| Foliar | Roya asiática | *P. pachyrhizi* | 14–28 | — | >75; >80 fuerte | precipitación | ≥6 h | — | — | dispersión | — | 5 d | O:T+HR>75+P; C:MF | MF, hospedante, inóculo | PARCIAL / PARCIAL | fila Excel | SINAVIMO | Activa; dos umbrales conservados en catálogo, sin alterar score |
| Tallo | Sclerotinia | *S. sclerotiorum* | 10–28 | — | ≥85 | lluvia | 42–72 h | alta | — | dispersión | R2–R3 | 5 d | O:T+HR 3/5 d+P; C:resto | MF, canopeo, drenaje, esclerocios | PARCIAL / PARCIAL | fila Excel | SINAVIMO | Activa; fenología aún sólo contexto |
| Tallo | Podredumbre marrón | *Cadophora gregata* | 17–27 | — | — | — | — | alta | — | — | R1–R7 | — | esencial: HS | HS calibrada, inóculo | NO_EVALUABLE / INSUFICIENTE | fila Excel | — | Catálogo |
| Raíz/tallo | Macrophomina | *M. phaseolina* | >30 | — | ~40 | baja | — | baja | sequía | — | VC–R6 | 14 d | O:5 d Tmax>30+HR≤45+P<10 | inóculo; fenología no aplicada | PARCIAL / PARCIAL | fila Excel | CPN charcoal rot | Activa; reutiliza el mismo criterio vigente de P<10 mm/14 d, no crea otra sequía |
| Raíz | Sclerotium | *S. rolfsii* | 30–35 | — | ≥85 | — | — | alta | — | — | — | — | esenciales: HS/suelo | textura, HS calibrada, inóculo | NO_EVALUABLE / INSUFICIENTE | fila Excel | — | Catálogo |
| Raíz | Rhizoctonia | *R. solani* | — | 26–32 | — | — | — | seca | — | — | VC | — | esenciales: Ts+HS | sequedad calibrada, inóculo | PENDIENTE_EVIDENCIA / INSUFICIENTE | fila Excel | CPN seedling diseases | No activa: conflicto “seco” vs fuente institucional “cálido y húmedo” |
| Tallo | Cancro meridional | *D. phaseolorum var. meridionalis* | 25–30 | — | — | lluvia | — | — | — | viento | R1–R7 | no usar latencia 15–20 d | contexto insuficiente | infección, inóculo | NO_EVALUABLE / INSUFICIENTE | fila Excel | — | Catálogo; latencia no convertida en ventana |
| Tallo | Cancro caulivora | *D. phaseolorum var. caulivora* | 20–25 | — | >90 (alta) | frecuente | — | — | — | — | R1–R7 | pendiente | esenciales: HR persistente+P frecuente | infección, rastrojo, inóculo | PARCIAL / PARCIAL | fila Excel + definición | — | Catalogada; no activa hasta formalizar persistencia/frecuencia |
| Foliar | Mancha ojo de rana | *C. sojina* | 25–35 | — | >90 | abundante | rocío | — | — | — | V1–R7 | 5 d | O:T+HR>90; C:P/rocío | rocío, inóculo | PARCIAL / PARCIAL | fila Excel | UMN frogeye | Activa; no inventa “abundante” en mm |
| Bacteriosis | Tizón bacteriano | *P. syringae pv. glycinea* | 15–20 | — | — | tormenta | — | — | — | viento/granizo | — | 3 d | O:T+P; C:V/lesión | granizo, lesión, inóculo | PARCIAL / PARCIAL | fila + definición | UMN bacterial blight | EXPERIMENTAL; viento observado no condiciona ni prueba tormenta/herida |
| Bacteriosis | Pústula bacteriana | *X. axonopodis pv. glycines* | 25–30 | — | — | tormenta | — | — | — | viento/granizo | — | 3 d | O:T+P; C:V/lesión | granizo, lesión, inóculo | PARCIAL / PARCIAL | fila + definición | UMN bacterial pustule | EXPERIMENTAL; mismas limitaciones |
| Virus | SMV | Soybean mosaic virus | — | — | — | — | — | — | — | viento | — | — | esencial: áfidos activos | vectores, inóculo | NO_EVALUABLE / INSUFICIENTE | fila Excel | — | Catálogo; viento solo no activa |
| Virus | AMV | Alfalfa mosaic virus | — | — | — | — | — | — | — | viento | — | — | esencial: áfidos activos | vectores, inóculo | NO_EVALUABLE / INSUFICIENTE | fila Excel | — | Catálogo; viento solo no activa |
| Foliar | Oídio | *E. diffusa* | 18–24; frena ~30 | — | >90 según definición | no requerida | — | — | — | — | reproductiva (fuente externa) | 5 d | O:T+HR | cultivar, inóculo | PARCIAL / PARCIAL | fila + definición | UMN powdery mildew | Activa; no usa lluvia; revisar HR con Natali |
| Foliar | Mildiu | *P. manshurica* | 20–22 | — | >90 | — | rocío | — | — | — | R1–R7 | 5 d | O:T+HR | rocío, inóculo | PARCIAL / PARCIAL | fila + definición | UMN downy mildew | Activa |

## Tabla de decisiones resumida

Cada fila anterior responde a los siete puntos requeridos: Natali (umbrales de “Fuente Natali”), contraste institucional, variables medibles (O/C), datos no medibles, regla final (“Decisión”), fundamento y estado. Las decisiones transversales son:

1. Se evalúan 10 reglas `PARCIALMENTE_EVALUABLE`: cinco ESTABLES participan del estado general y cinco EXPERIMENTALES quedan fuera del score. Mancha marrón y cancro caulivora también son parciales, pero quedan sólo catalogadas hasta formalizar “lluvia frecuente/persistente” sin inventar umbrales. Ninguna se califica `EVALUABLE`.
2. Diez enfermedades quedan `NO_EVALUABLE`: muerte súbita, Phytophthora, Pythium, Fusarium de raíz, complejo EFC agregado, podredumbre marrón, Sclerotium, cancro meridional, SMV y AMV. Rhizoctonia queda `PENDIENTE_EVIDENCIA` por conflicto real.
3. No se crea `MOJADO_FOLIAR_ESTIMADO`. Open-Meteo no entrega mojado foliar y, aunque entrega HR/punto de rocío/VPD horarios, Avizor los colapsa a promedios diarios. Esa pérdida impide afirmar 6, 12 o 42–72 horas. Estado: `NO_DISPONIBLE`, no falso.
4. No se fijan umbrales absolutos de “suelo saturado/seco”: la humedad volumétrica depende de textura y capacidad de campo/punto de marchitez, ausentes. Los valores del proveedor son `OBSERVADO`/modelado por proveedor, pero la clase agronómica permanece `NO_DISPONIBLE`.
5. La regla genérica `enfermedades_foliares` v1.0 se `DEPRECA/RETIRA` al activar reglas específicas. Heladas, baja precipitación y precipitación elevada se `MANTIENEN`. No se introdujo una señal EFC agregada para evitar duplicación.

## Fuentes complementarias

- INTA: [Enfermedades en soja: qué hacer ante los primeros síntomas](https://intainforma.inta.gob.ar/enfermedades-en-soja-que-hacer-ante-los-primeros-sintomas/); [Cómo prevenir el desarrollo de plagas y enfermedades](https://intainforma.inta.gob.ar/como-prevenir-el-desarrollo-de-plagas-y-enfermedades/); [Enfermedades de soja: diagnóstico y tratamiento](https://repositorio.inta.gob.ar/xmlui/bitstream/handle/20.500.12123/15954/INTA_CRBsAsNorte_EEAPergamino_Ivancovich_A_Enfermedades_soja_diagnotico_tratamiento.pdf?isAllowed=y&sequence=1); [Enfermedades de las semillas en soja](https://repositorio.inta.gob.ar/bitstream/handle/20.500.12123/3276/Agro_barrow_55_p.6-7.pdf?isAllowed=y&sequence=1).
- SINAVIMO/SENASA: [Roya asiática](https://www.sinavimo.gob.ar/plaga/phakopsora-pachyrhizi); [Sclerotinia](https://www.sinavimo.gob.ar/plaga/sclerotinia-sclerotiorum).
- Extensión universitaria/Crop Protection Network: [SDS](https://extension.umn.edu/soybean-pest-management/sudden-death-syndrome-soybean), [Septoria](https://extension.umn.edu/agriculture/crop-production/soybean/septoria-brown-spot), [ojo de rana](https://extension.umn.edu/agriculture/crop-production/soybean/frogeye-leaf-spot), [tizón bacteriano](https://extension.umn.edu/pest-management/bacterial-blight-soybean), [pústula](https://extension.umn.edu/agriculture/crop-production/soybean/bacterial-pustule-soybean), [oídio](https://extension.umn.edu/agriculture/crop-production/soybean/powdery-mildew-soybean), [mildiu](https://extension.umn.edu/agriculture/crop-production/soybean/downy-mildew), [enfermedades de plántula](https://cropprotectionnetwork.org/publications/an-overview-of-soybean-seedling-diseases), [Macrophomina](https://cropprotectionnetwork.org/publications/an-overview-of-charcoal-rot-of-soybean).
- Proveedor: [Open-Meteo Weather API](https://open-meteo.com/en/docs), consultada el 2026-08-24; documenta suelo, HR, punto de rocío, VPD, ET₀, lluvia y viento, pero no mojado foliar.

## Versionado y auditoría

La migración 009 crea un catálogo versionado, no destructivo, con fuente, evaluabilidad, cobertura, condiciones normalizadas y factores ausentes. Las reglas v2.0 se insertan como nuevas versiones; las versiones previas no se borran. Los cambios posteriores mediante el endpoint admin continúan registrándose en `auditoria`. Rollback razonable: marcar v2.0 `retirada`, reactivar `enfermedades_foliares` v1.0 y conservar el catálogo como historial.
