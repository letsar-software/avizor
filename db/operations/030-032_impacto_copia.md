# Reporte de impacto — migraciones 030, 031 y 032 (copia restaurada)

Simulación en transacción revertida (ROLLBACK) sobre una copia: no persiste cambios.

## Migraciones que se incorporarían (orden de ejecución)

1. `030_agronomic_advisories.sql`
2. `031_variables_criticas_complementarias.sql`
3. `032_variables_y_datos_de_campo.sql`

Dependencias: 030 y 031 requieren `categorias_agronomicas` (027); 032 requiere `empresas` (014). Ninguna depende de datos de desarrollo.

## Filas por tabla

| Tabla | Antes | Después | Nuevas |
| --- | --- | --- | --- |
| reglas_agronomicas | 32 | 32 | 0 |
| categorias_agronomicas | 5 | 5 | 0 |
| agronomic_advisories | no existe | 0 | 0 (tabla nueva) |
| variables_agronomicas | no existe | 37 | 37 (tabla nueva) |
| lotes | no existe | 0 | 0 (tabla nueva) |
| datos_campo | no existe | 0 | 0 (tabla nueva) |
| migracion_031_respaldo | no existe | 32 | 32 (tabla nueva) |
| migracion_031_vinculos | no existe | 20 | 20 (tabla nueva) |
| auditoria | 176 | 176 | 0 |
| consultas | 339 | 339 | 0 |
| consulta_logs | 82 | 82 | 0 |

## Reglas

| Indicador | Valor |
| --- | --- |
| Reglas modificadas | 21 |
| Reglas no modificadas | 11 |
| categoria_id existentes sobrescritos | 0 |
| Idempotente (030–032 repetidas sin cambios) | sí |

## Reglas por categoría

| Categoría | Antes | Después |
| --- | --- | --- |
| (sin categoría) | 20 | 0 |
| enfermedades_foliares | 4 | 21 |
| estres_hidrico | 4 | 5 |
| exceso_hidrico | 1 | 2 |
| heladas | 3 | 4 |

## Reglas a vincular (antes de aplicar)

| cultivo | clave | version | candidatas | origenes |
| --- | --- | --- | --- | --- |
| soja | antracnosis | 2.0 | enfermedades_foliares | catalogo_sanitario |
| soja | baja_precipitacion | 1.0 | estres_hidrico | clave_climatica |
| soja | cercospora_kikuchii | 2.0 | enfermedades_foliares | catalogo_sanitario |
| soja | macrophomina | 2.0 | enfermedades_foliares | catalogo_sanitario |
| soja | mancha_ojo_rana | 2.0 | enfermedades_foliares | catalogo_sanitario |
| soja | mildiu | 2.0 | enfermedades_foliares | catalogo_sanitario |
| soja | oidio | 2.0 | enfermedades_foliares | catalogo_sanitario |
| soja | precipitacion_elevada | 1.0 | exceso_hidrico | clave_climatica |
| soja | pustula_bacteriana | 2.0 | enfermedades_foliares | catalogo_sanitario |
| soja | roya_asiatica | 2.0 | enfermedades_foliares | catalogo_sanitario |
| soja | sclerotinia | 2.0 | enfermedades_foliares | catalogo_sanitario |
| soja | temperatura_bajo_umbral | 1.0 | heladas | clave_climatica |
| soja | tizon_bacteriano | 2.0 | enfermedades_foliares | catalogo_sanitario |
| trigo | fusariosis_espiga | 1.0 | enfermedades_foliares | catalogo_sanitario |
| trigo | mancha_amarilla | 1.0 | enfermedades_foliares | catalogo_sanitario |
| trigo | roya_amarilla | 1.0 | enfermedades_foliares | catalogo_sanitario, categoria_nombre |
| trigo | roya_amarilla_mojado_foliar | 1.0 | enfermedades_foliares | categoria_nombre |
| trigo | roya_hoja | 1.0 | enfermedades_foliares | catalogo_sanitario |
| trigo | roya_tallo | 1.0 | enfermedades_foliares | catalogo_sanitario |
| trigo | septoriosis | 1.0 | enfermedades_foliares | catalogo_sanitario |

### Afectadas por cultivo

| cultivo | reglas |
| --- | --- |
| soja | 13 |
| trigo | 7 |

### Afectadas por categoría

| categoria | reglas |
| --- | --- |
| enfermedades_foliares | 17 |
| estres_hidrico | 1 |
| exceso_hidrico | 1 |
| heladas | 1 |

## Sin correspondencia (no se modifican, revisar)

_Ninguna._

## Ambiguas (no se modifican, revisar)

_Ninguna._

## Con categoria_id existente (no se modifican)

| cultivo | clave | version | categoria_actual | candidatas |
| --- | --- | --- | --- | --- |
| soja | enfermedades_foliares | 1.0 | enfermedades_foliares | enfermedades_foliares |
| soja | — | — | enfermedades_foliares | enfermedades_foliares |
| soja | — | — | heladas | heladas |
| soja | — | — | estres_hidrico | estres_hidrico |
| soja | — | — | estres_hidrico | estres_hidrico |
| soja | — | — | estres_hidrico | estres_hidrico |
| soja | — | — | enfermedades_foliares | enfermedades_foliares |
| soja | — | — | enfermedades_foliares | enfermedades_foliares |
| soja | — | — | heladas | heladas |
| trigo | baja_precipitacion | 1.0 | estres_hidrico | estres_hidrico |
| trigo | precipitacion_elevada | 1.0 | exceso_hidrico | exceso_hidrico |
| trigo | temperatura_bajo_umbral | 1.0 | heladas | heladas |

### Existentes cuya categoría difiere de la derivada (sólo reporte)

_Ninguna._

## Duplicados potenciales (más de una versión activa)

_Ninguna._

## Valores no reconocidos

### categoria_nombre que no es clave de categoría

| categoria_nombre | reglas | cultivos |
| --- | --- | --- |
| bacteriosis | 2 | soja |
| baja_precipitacion | 1 | soja |
| fin_ciclo | 2 | soja |
| foliar | 9 | soja, trigo |
| precipitacion_elevada | 1 | soja |
| raiz_tallo | 1 | soja |
| tallo | 1 | soja |
| temperatura_bajo_umbral | 1 | soja |

### Reglas vinculadas a categorías inactivas

_Ninguna._

### Variables repetidas en ambas listas (después)

_Ninguna._

### Variables fuera del catálogo (después)

_Ninguna._


## Estrategia de rollback

- 032: tablas nuevas sin datos (salvo la semilla del catálogo); revertir con `drop table datos_campo, lotes, variables_agronomicas` si todavía no se cargaron datos.
- 031: `db/operations/031_rollback.sql` deshace sólo los vínculos registrados en `migracion_031_vinculos` y restaura listas y textos desde `migracion_031_respaldo`. Termina en `rollback;` para revisar antes de confirmar.
- 030: tabla nueva `agronomic_advisories`, vacía; revertir con `drop table agronomic_advisories` si no se publicaron avisos.
- En todos los casos, quitar la fila correspondiente de `schema_migrations`.

## Riesgos pendientes

- 031 corrige textos visibles de reglas de trigo y soja por reemplazo exacto: un texto editado a mano después no se toca (queda como está).
- 031 completa variables críticas/complementarias sólo en roya amarilla (dos reglas) y exceso hídrico; el resto sigue usando variables_requeridas como críticas.
- Las tablas migracion_031_respaldo y migracion_031_vinculos quedan en la base hasta confirmar que no hace falta revertir.
- 032 crea lotes y datos de campo vacíos: el uso de lot_id requiere dar de alta lotes y vincularlos a una empresa.
- El runner aplica 030–032 al ejecutar db:migrate: no correrlo contra producción sin aprobación explícita del reporte.