# Matriz de validación agronómica — trigo

**Destinataria:** Natali · **Estado:** revisión previa. Todas las reglas de trigo continúan **experimentales** y **pendientes de validación agronómica**. Este documento no modifica soja, reglas productivas ni score.

## Criterio de lectura

`Actual` significa que el adaptador ya solicita el dato horario de Open-Meteo y luego lo resume a día. `Campo` significa que no puede inferirse desde el clima. Ninguna fila autoriza diagnosticar enfermedad, plaga, anegamiento, estrés real ni daño por helada.

| ID | Categoría / fenómeno | Condición y duración agronómica | Fenología / contexto | Datos Avizor | Faltantes / campo | Tipo de evidencia | Institución, publicación y enlace | Estado actual | Decisión de Natali |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRI-ENF-001 | Roya amarilla — *Puccinia striiformis* f. sp. *tritici* | UGA: desarrollo rápido 10–16 °C, germinación 7–15 °C; agua libre. ≥6 h de mojado es propuesta, no umbral aprobado. | Tejido susceptible e inóculo requeridos. | Actual: T, HR, lluvia, punto de rocío horarios. | Mojado foliar, inóculo, pústulas: campo. | Bibliografía técnica + criterio propuesto. | UGA, [*Stripe Rust of Wheat*, C960](https://extension.uga.edu/publications/detail.html?number=C960&title=stripe-rust-yellow-rust-of-wheat); [SINAVIMO](https://www.sinavimo.gob.ar/plaga/puccinia-striiformis). | Parcial; no evalúa infección. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-ENF-002 | Roya de la hoja — *Puccinia triticina* | 15–22 °C y humedad libre; ≥6 h de mojado queda preliminar. | Inóculo y susceptibilidad varietal. | Actual: T, HR, lluvia, punto de rocío. | Mojado/inóculo/cultivar: campo. | Bibliografía técnica + criterio propuesto. | NMSU, [*Leaf, Stem, and Stripe Rust Diseases*](https://pubs.nmsu.edu/_a/A415/); UGA, [*Leaf Rust*](https://extension.uga.edu/publications/detail.html?number=C1060&title=identification-and-control-of-leaf-rust-of-wheat). | Parcial. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-ENF-003 | Roya del tallo — *Puccinia graminis* f. sp. *tritici* | NMSU: óptimo 18–30 °C y humedad libre. Las 10 h de mojado son preliminares. | Inóculo y tejido susceptible. | Actual: T, HR, lluvia, punto de rocío. | Mojado e inóculo: campo. | Bibliografía técnica + criterio propuesto. | NMSU, [publicación](https://pubs.nmsu.edu/_a/A415/). | Parcial. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-ENF-004 | Mancha amarilla — *Pyrenophora tritici-repentis* | El período húmedo requerido depende de T. El rango 10–30 °C / 6–48 h es referencia preliminar, **no binaria**. | Daño mayor citado desde embuchado a grano pastoso; rastrojo importa. | Actual: T, HR, lluvia. | Mojado, residuo/inóculo, severidad: campo. | Bibliografía técnica; umbral pendiente. | Nebraska Extension, [*Tan Spot of Wheat*, G429](https://extensionpubs.unl.edu/publication/g429/2012/html/view). | No evaluable. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-ENF-005 | Septoriosis — *Zymoseptoria tritici* | UC IPM: 16–25 °C y ~6 h de mojado con humedad libre. Neblina/llovizna no equivalen a mojado. | Inóculo y salpicado/ascosporas. | Actual: T, HR, lluvia. | Mojado, residuo/inóculo, síntomas: campo. | Bibliografía técnica. | UC IPM, [*Septoria Tritici Blotch*](https://ipm.ucanr.edu/agriculture/small-grains/septoria-tritici-blotch-of-wheat/). | Parcial. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-ENF-006 | Fusariosis de la espiga — *Fusarium graminearum* | UGA: alta humedad coincidente con floración; 25–30 °C en la tabla citada. Lluvia sola no basta. | Floración (Z60–69) confirmada. | Actual: T, HR, lluvia; etapa manual opcional. | Mojado, inóculo y floración confirmada: campo. | Bibliografía técnica + decisión funcional. | UGA, [*Wheat Production Guide*](https://extension.uga.edu/content/dam/extension-county-offices/screven-county/2022-2023-Wheat-Production-Guide.pdf); [nota FHB](https://site.extension.uga.edu/worthag/2022/03/small-grain-update-for-the-week-3-25-22/). | Bloqueada sin floración. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-EH-001 | Demanda hídrica estimada | ETc = Kc × ET0. FAO-56: Kc 0,35 inicial, 0,75 desarrollo, 1,15 medio, 0,45 final; requieren ajuste local. | Etapa/Kc validados. | Actual: ET0, T, HR, viento, radiación. | Etapa, calendario/cultivar, ajuste local. | Bibliografía técnica. | FAO-56, [cap. 6](https://www.fao.org/4/X0490E/x0490e0b.htm), [tabla Kc](https://www.fao.org/4/S2022E/s2022e07.htm). | Calculable sólo como demanda orientativa. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-EH-002 | Déficit meteorológico | Comparación lluvia–ETc en período declarado; no es agua disponible. | Etapa/Kc adoptados. | Actual: precipitación, ET0, humedad de suelo modelada. | Riego, lluvia efectiva, raíces, suelo. | Decisión funcional basada en FAO-56. | FAO-56, [cap. 6](https://www.fao.org/4/X0490E/x0490e0b.htm). | Pendiente; no alerta. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-EH-003 | Estrés hídrico real | Requiere déficit en zona radicular, no sólo lluvia/ET0. | Etapa y cultivar. | Actual: humedad de suelo modelada 0–81 cm. | Calibración, textura, CC/PMP, raíces, riego y síntomas: campo. | Decisión funcional de Avizor. | FAO-56, [cap. 8](https://www.fao.org/4/X0490E/x0490e0d.htm). | No evaluable. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-EXH-001 | Lluvias persistentes | Frecuencia/intensidad/acumulado; no prueban saturación. | Suelo y etapa. | Actual: precipitación y humedad modelada. | Infiltración, drenaje, relieve. | Decisión funcional. | [Open-Meteo Weather API](https://open-meteo.com/en/docs?past_days=1). | Descriptiva, no anegamiento. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-EXH-002 | Posible acumulación hídrica | Lluvia persistente + humedad de suelo modelada: señal de revisión, no diagnóstico. | Suelo y etapa. | Actual: precipitación, T, humedad de suelo. | Umbral local de saturación/drenaje. | Criterio propuesto + decisión funcional. | University of Minnesota, [*Wheat flooding and waterlogging*](https://extension.umn.edu/agriculture/crop-production/small-grains/wheat-flooding-and-waterlogging). | Parcial. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-EXH-003 | Anegamiento efectivo | La referencia 3–4 días aplica a suelo anegado real; **no se deriva de días de lluvia**. | Variedad y temperatura importan. | Ninguna variable confirma anegamiento. | Agua/saturación y duración: campo. | Bibliografía técnica. | University of Minnesota, [publicación](https://extension.umn.edu/agriculture/crop-production/small-grains/wheat-flooding-and-waterlogging). | No evaluable automáticamente. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-HEL-001 | Exposición a frío | Para ~2 h: macollaje −11 °C; encañazón −4 °C; embuchado −2 °C; espigazón/floración −1 °C; grano lechoso/pastoso −2 °C. La mínima diaria no prueba duración. | Etapa obligatoria. | Actual: temperatura horaria 2 m y mínima diaria. | Temperatura de dosel, microrelieve y exposición: campo. | Bibliografía técnica + decisión funcional. | Kansas State, [*Spring Freeze Injury to Kansas Wheat*, C646](https://bookstore.ksre.k-state.edu/download/spring-freeze-injury-to-kansas-wheat_C646). | Parcial; sin duración no infiere daño. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |

## Plagas: umbrales de monitoreo, no reglas climáticas

Fuente común: INTA EEA Reconquista, [*Insectos en el cultivo de trigo — Guía ilustrada*, tabla 1](https://repositorio.inta.gob.ar/xmlui/bitstream/handle/20.500.12123/16928/INTA_CRSantaFe_EEAReconquista_Vitti_D_Insectos_en_el_cultivo_de_trigo_guia_ilustrada_3.pdf?isAllowed=y&sequence=1). En todas: Avizor tiene clima, pero abundancia/daño requieren campo; no activar presencia por clima.

| ID | Plaga / nombre científico | Fenología | Umbral / unidad | Tipo de evidencia | Estado actual | Decisión de Natali |
| --- | --- | --- | --- | --- | --- | --- |
| TRI-PLA-001 | Pulgón verde — *Schizaphis graminum* | Emergencia–15 días; posterior. | 3–5; luego 10–15 pulgones/planta. | Bibliografía técnica INTA. | Catálogo; no evaluable climáticamente. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-PLA-002 | Pulgón de la avena — *Rhopalosiphum padi* | Macollaje–floración. | 20 % plantas con ≥10 pulgones; 10 pulgones/espiga. | Bibliografía técnica INTA. | Catálogo; no evaluable climáticamente. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-PLA-003 | Pulgón de la espiga — *Sitobion avenae* | Espigazón–floración; grano acuoso. | 5 pulgones/planta o espiga; 20–30 en grano acuoso. | Bibliografía técnica INTA. | Catálogo; no evaluable climáticamente. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-PLA-004 | Oruga militar — *Pseudaletia adultera* (sin. *Mythimna adultera*) | Grano acuoso, lechoso y pastoso blando. | 5 y 15 orugas >1,5 cm/m². | Bibliografía técnica INTA. | Catálogo; no evaluable climáticamente. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-PLA-005 | Oruga desgranadora — *Faronta albilinea* (sin. *Dargida albilinea*) | Desde espigazón. | 5–10 espigas dañadas/m². | Bibliografía técnica INTA. | Catálogo; no evaluable climáticamente. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| TRI-PLA-006 | Chinche verde — *Nezara viridula* | Desde espiga embuchada. | 5 chinches/m². | Bibliografía técnica INTA. | Catálogo; no evaluable climáticamente. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |

## Ventana histórica de Avizor ≠ duración agronómica

| Ventana | Uso permitido | Fundamento / límite | Decisión de Natali |
| --- | --- | --- | --- |
| 5 días | Contexto reciente de royas/FHB. | No reemplaza 6–10 h de mojado. FHB debe coincidir con floración. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| 7 días | Contexto de humedad persistente, mancha/septoriosis y lluvia frecuente. | No convierte 6–48 h de humedad o ~6 h de mojado en siete días de HR/lluvia. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| 14 días | Balance meteorológico lluvia–ET0. | No mide agua útil, riego, raíces ni estrés real; longitud es decisión funcional revisable, no umbral FAO. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |
| 1 día/evento | Revisión de frío. | La bibliografía exige ~2 h; conservar serie horaria. | ☐ Aprobar ☐ Ajustar ☐ Rechazar ☐ Requiere más evidencia |

## Variables disponibles y brechas

Open-Meteo provee horarios de T 2 m, HR, precipitación, viento, punto de rocío, ET0, humedad y temperatura de suelo por capas; el adaptador actual ya los pide. No provee mojado foliar, inóculo, saturación de lote, temperatura de cultivo, tipo de suelo, riego ni conteos biológicos. Referencia: [Open-Meteo Weather API](https://open-meteo.com/en/docs?past_days=1). Prioridad futura: conservar horas en rango térmico/HR y bajo umbral, sin usar HR como sustituto de mojado.

## Zadoks: hitos orientativos, no excluyentes

Los rangos Zadoks se solapan por órgano/tallo y transición: no son casilleros mutuamente excluyentes. Encañazón Z30–39 contiene hoja bandera Z37–39; espigazón Z50–59 transiciona hacia floración Z60–69. Usar etapa declarada y definir con Natali la regla de resolución para macollos desparejos.

| Hito | Zadoks orientativo |
| --- | --- |
| Emergencia | Z10 |
| Macollaje | Z20–29 |
| Encañazón | Z30–39 |
| Hoja bandera | Z37–39 (subhito de encañazón) |
| Embuchado | Z45–49 |
| Espigazón | Z50–59 |
| Floración | Z60–69 |
| Llenado de grano | Z70–89 |
| Madurez | Z90+ |

**Registro de revisión:** Natali debe consignar fuente, alcance regional, umbral, duración, etapa, variables y limitaciones antes de promover cualquier fila. Hasta entonces, todas permanecen experimentales, pendientes y sin alertas productivas.
