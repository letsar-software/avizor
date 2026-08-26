# Panel de administración — Fases 0 a 7 (plan completo)

Fecha: 2026-08-25
Estado: las 7 fases del plan de arquitectura original están implementadas y mergeadas a `main` (PR #1, #2, #4, #5, #6, #7, #8, #9 — se saltea el #3, no correspondía a este plan).

## Fase 0 — Auth y layout base

Objetivo del plan de arquitectura (sección 3.4): reemplazar el token único compartido por usuarios con rol, sin sumar un proveedor de identidad externo.

**Base de datos**
- `db/migrations/010_usuarios_admin.sql` — tablas `usuarios_admin` (email, nombre, rol, password_hash, estado) y `sesiones_admin` (token_hash, expira_en). Numerada `010` y no `013` como en el documento original: en el repo real la última migración era la `009`; las `010`-`012` del plan corresponden a plagas/fenología, todavía no implementadas.
- `scripts/create-admin-user.js` — bootstrap manual del primer usuario (`npm run db:create-admin`), necesario porque todavía no hay flujo de invitación.

**Autenticación**
- `lib/admin/auth.ts` — hash de contraseña con `scrypt` (sin sumar `bcrypt` como dependencia), sesiones con token aleatorio hasheado en `sesiones_admin`, expiran a las 12 h.
- `lib/admin/session-cookie.ts` — único módulo que conoce `next/headers` y el nombre de la cookie (`avizor_admin_session`); cookie httpOnly, `sameSite=lax`, `secure` en producción.
- `app/api/admin/auth/login/route.ts` y `.../logout/route.ts` — siguen el patrón `DomainError`/`success`/`failure` del resto de la API. Login con rate limit propio (`adminLogin`, 8 intentos / 15 min).

**Permisos**
- `lib/admin/permissions.ts` — matriz de la sección 3.4 del plan (dashboard, reglas, reglas_promover, laboratorio, plagas/cultivos/fenología, usuarios, empresas, auditoría, configuración × administrador/agrónomo/soporte).
- `lib/admin/nav.ts` — config de navegación del sidebar, separada del componente de render.

**Panel**
- `app/admin/(protected)/layout.tsx` — guard: sin sesión válida redirige a `/admin/login`; arma sidebar + header con el rol del usuario.
- `app/admin/login/page.tsx` — formulario de login.
- `components/LayoutChrome.tsx` — oculta el header/footer público del sitio en rutas `/admin`, sin tocar la estructura del resto de las páginas.

## Fase 1 — Reglas + Laboratorio

Objetivo del plan: UI completa sobre los endpoints que ya existían (`/api/admin/reglas`, `/api/admin/simulaciones`), que hasta acá solo se podían usar con un token de servicio.

**Acceso dual en las API routes**
- `lib/admin/access.ts` — `requireAdminAccess(request, modulo, accesoRequerido)` acepta *o* la cookie de sesión del panel (chequeando el rol contra `permissions.ts`) *o* el token de servicio existente (`AVIZOR_INTERNAL_TOKEN`, acceso total, sin cambios de comportamiento para integraciones externas). `requireAdminPageAccess(modulo, acceso)` hace lo mismo para Server Components, con redirect en vez de 403.
- Reescableados con este guard: `GET /api/admin/reglas`, `GET/PATCH /api/admin/reglas/[id]`, `POST /api/admin/simulaciones`.

**Reglas de negocio que estaban pendientes (plan, sección 4)**
- RN-004: el `PATCH` ahora rechaza cambios de `definicion` si la regla está `vigente` (`REGLA_VIGENTE_INMUTABLE`, 409). Antes se podía editar in place.
- RN-013: no se puede promover una regla a `vigente` sin `validado_por` y `validado_en` completos (`VALIDACION_REQUERIDA`, 422), y solo un rol con permiso `reglas_promover` (administrador) puede hacerlo.
- `lib/security/validation.ts` — `adminRulePatchSchema` ahora acepta `validado_por`/`validado_en` opcionales.
- `lib/rules/repository-v2.ts` — se agregó `getReglaAdministrableById` para el detalle de una regla.

**Páginas**
- `/admin/reglas` — listado (cultivo, categoría, versión, estado, ventana) leyendo directo del repositorio (Server Component, sin round-trip HTTP).
- `/admin/reglas/[id]` + `components/admin/RuleEditor.tsx` — editor con formulario tipado (dropdowns de variable/agregador/operador, sin JSON crudo), que se bloquea automáticamente si la regla es `vigente`.
- `/admin/laboratorio` + `components/admin/RuleLab.tsx` — corre una simulación real (localidad + cultivo) contra el `ConsultaService` existente y muestra estado general, reglas evaluadas y motivo.

**Fork de reglas vigentes (agregado 2026-08-25, rama `feature/fork-reglas-vigentes`)**
- `POST /api/admin/reglas/[id]/versiones` — crea una fila nueva en `estado='experimental'` a partir de cualquier regla existente, vía `insert ... select` que copia todas las columnas de origen (incluidas las legacy de v1, que siguen `not null`) salvo `version`/`estado`/`validado_por`/`validado_en`, que se resetean. Requiere el mismo permiso que el `PATCH` (`reglas`, `write`); loguea `auditoria` con `accion='crear_version'`, igual que el patrón ya usado en las migraciones 009/013.
- `lib/rules/versioning.ts` — `nextVersion()`, función pura que bumpea el minor (`"2.0" → "2.1"`), con fallback si la versión no matchea `major.minor`. Testeada en `tests/versioning.test.ts`. La ruta reintenta el bump si la versión calculada ya existe (fork repetido de la misma regla).
- `RuleEditor.tsx` suma el botón "Crear nueva versión" junto al aviso de regla bloqueada; al crear, redirige a `/admin/reglas/[nuevoId]` para seguir editando ahí.

**Fuera de esta fase**
- No se pudo probar el flujo con datos reales (login, listar, guardar) porque no hay `DATABASE_URL` en este entorno de desarrollo. Se verificó con `tsc`, `eslint`, `next build` limpios, y en el browser que las rutas nuevas respetan el guard sin sesión.

**Refactor SOLID posterior**: `lib/rules/condition-spec.ts` se agregó como fuente única de los enums de variable/agregador/operador/estado de regla (antes duplicados entre `validation.ts`, `types/index.ts` y el editor). `RuleEditor.tsx` se partió en un hook de estado (`useRuleDefinitionEditor`) + componentes de presentación puros (`RuleMetaFields`, `NivelEditor`, `CondicionEditor`).

## Fase 2 — Plagas ([PR #4](https://github.com/letsar-software/avizor/pull/4), mergeado)

- Migraciones `011` (`tipo_regla`/`grupo_plaga`/`especie`/`nivel_evidencia_climatica` en `reglas_agronomicas`) y `012` (`zonas_agronomicas`, `catalogo_plagas`, `plagas_regionales`).
- `lib/rules/aplicabilidad.ts` — resuelve zona/fenología/período como paso previo a evaluar clima, función pura con 9 tests propios, integrada a `engine-v2.ts` vía un contexto opcional (backward compatible).
- UI: `/admin/plagas`, `/admin/plagas/[id]` (catálogo + regionalización), `/admin/zonas`.
- **Deliberadamente fuera de esta fase**: el algoritmo de zona-desde-localidad y el modo exclusión/prioridad por defecto (PEND-10, PEND-15 del documento de plagas) — son decisiones agronómicas, no técnicas.
- ⚠️ **Actualización importante** (ver sección "Hallazgo" más abajo): un commit posterior y ajeno a este plan (`bd66ed7`, ya en `main`) construyó un segundo motor de evaluación de plagas en paralelo (`lib/pests/`), con su propia tabla (`reglas_plagas`) y su propia resolución de zona. El motor de esta fase (`lib/rules/aplicabilidad.ts` sobre `reglas_agronomicas`) **no es el que corre hoy en producción** para plagas — quedó como scaffolding sin conectar. El catálogo administrable (`catalogo_plagas`, `plagas_regionales`, `zonas_agronomicas`) sí lo usa el motor nuevo, así que `/admin/plagas` sigue siendo válido.

## Fase 3 — Cultivos + Dashboard ([PR #5](https://github.com/letsar-software/avizor/pull/5), mergeado)

- `/admin/cultivos`: `/api/admin/cultivos` y `/api/admin/cultivos/[id]` migrados a `requireAdminAccess` + repositorio propio (`lib/cultivos/repository.ts`).
- `/admin` (dashboard) deja de ser un placeholder: `lib/dashboard/repository.ts` calcula consultas (7d/30d/total), desglose por estado general y por confianza (proxy de cobertura), reglas activas, cultivos activos — cada métrica su propia función chica.

## Fase 4 — Usuarios y Auditoría ([PR #6](https://github.com/letsar-software/avizor/pull/6), mergeado)

- Sin migraciones nuevas: `usuarios_admin`/`sesiones_admin`/`auditoria` ya existían.
- `lib/admin/user-spec.ts` centraliza rol/estado de usuario. `lib/usuarios/repository.ts` nunca hace `select *`: `password_hash` no puede filtrarse a una respuesta ni a auditoría.
- `/admin/usuarios` (alta + listado + edición de rol/estado/contraseña), `/admin/auditoria` (solo lectura, filtro por entidad/acción vía GET).

**Invitación de usuarios (agregado 2026-08-25, rama `feature/invitacion-usuarios`)**
- Migración `017_invitaciones_admin.sql`: tabla `invitaciones_admin` (`usuario_id`, `token_hash`, `expira_en`, `aceptada_en`). `usuarios_admin.estado='invitado'` y `password_hash` nullable ya estaban en el schema desde la `010`, sin usarse para esto — el alta simplemente ponía al usuario `activo` con una contraseña elegida por el admin.
- `lib/admin/auth.ts` suma `createAdminInvitation`/`getAdminInvitation`/`acceptAdminInvitation`, mismo patrón de inyección de `queryImpl` que `createAdminSession`/`getAdminSession` (testeables sin Postgres real — `tests/admin-invitaciones.test.ts`, 7 casos). El token vive 7 días, es de un solo uso (`aceptada_en`) y deja de servir si el usuario cambia de estado por fuera del flujo.
- No hay infraestructura de envío de email en el proyecto (ver "Notificaciones e Integraciones", Fase 7), así que el enlace de invitación se genera y se devuelve **una sola vez** en la respuesta del alta (`POST /api/admin/usuarios`) — mismo patrón ya usado para la clave de una API key nueva (Fase 5). `POST /api/admin/usuarios/[id]/invitaciones` reenvía un enlace nuevo si el anterior venció o se perdió, mientras el usuario siga `invitado`.
- `POST /api/admin/auth/aceptar-invitacion` (público, sin sesión) + `GET` para previsualizar a quién pertenece el enlace antes de pedir contraseña. Acepta, fija la contraseña, pasa el usuario a `activo` y lo loguea (misma sesión por cookie que el login normal). Rate-limited por IP (`RATE_LIMITS.adminInviteAccept`).
- `UsuarioForm.tsx` ya no pide contraseña; muestra el enlace una vez vía `InvitationLinkReveal.tsx` (componente compartido con `ReenviarInvitacionButton.tsx`, que aparece en `/admin/usuarios/[id]` mientras el usuario esté `invitado`). Página pública `/admin/invitacion?token=...` con `AceptarInvitacionForm.tsx`.
- **Verificado**: `tsc`, `eslint`, `next build` y la suite completa de tests limpios. Se probó en el navegador contra la base real de Railway (única environment del proyecto, `production`) que la ruta de validación conecta y responde — el único error observado fue `relation "invitaciones_admin" does not exist`, esperado porque la migración `017` todavía no se corrió ahí. **Pendiente**: aplicar la migración `017` en producción (`npm run db:migrate`) antes de que el flujo funcione de punta a punta.

## Fase 5 — Empresas y API Keys ([PR #7](https://github.com/letsar-software/avizor/pull/7), mergeado)

- Migración `014`: tabla `empresas` nueva, `api_keys` ligada a ella (`empresa_id`, `scopes`).
- `hashApiKey` centralizado en `lib/security/api-keys.ts` (una sola función deriva el hash tanto para crear como para verificar). `lib/empresas/api-keys-repository.ts` nunca expone `key_hash`.
- `/admin/empresas`, `/admin/empresas/[id]` (alta de API key con la clave mostrada una sola vez, consumo real vía `api_uso`, revocación).
- **Bug encontrado y corregido en el mismo pase**: `window.confirm()` para revocar una key no funcionaba en el entorno de pruebas (diálogos nativos deshabilitados). Se reemplazó por confirmación en dos pasos dentro de la UI.
- **Fuera de esta fase**: los scopes son texto libre, no hay taxonomía cerrada ni enforcement en `/api/v1` todavía.

**Taxonomía cerrada de scopes (agregado 2026-08-26, rama `feature/api-key-scopes`)**
- `lib/empresas/spec.ts`: `API_KEY_SCOPES` pasa de un patrón de texto libre a un enum cerrado — hoy un solo valor, `consultas:crear`, uno por cada endpoint real de `/api/v1` (que hoy es uno solo, `POST /api/v1/consultas`). Sumar un endpoint nuevo es agregar un valor acá.
- `lib/security/validation.ts`: `adminApiKeyCreateSchema.scopes` valida contra ese enum (`z.enum(API_KEY_SCOPES)`) en vez de una regex.
- `lib/security/api-keys.ts`: `authenticateApiKey(request, requiredScope, usage)` ahora recibe el scope que exige el endpoint que llama, lo verifica contra `key.scopes` (ya lo trae en el mismo `select ... for update` que usaba para el límite mensual) y devuelve `403 SCOPE_NO_AUTORIZADO` si falta — antes cualquier key con cualquier scope (o ninguno) podía pegarle a cualquier endpoint. El chequeo corre antes que el de cuota mensual.
- Migración `018`: agrega el mismo enum como `check` a nivel de base (`scopes <@ array['consultas:crear']`), mismo patrón que el resto de los enums del proyecto (`estado`, `rol`, `tipo_regla`) — se valida en la app y en la base. Sin riesgo de romper datos existentes: `api_keys` está vacía en producción.
- `ApiKeyForm.tsx`: el input de texto libre "separados por coma" pasa a ser un grupo de checkboxes con los valores de `API_KEY_SCOPES` — no se puede tipear un scope inválido desde el panel.
- **Verificado en producción (2026-08-26)**: migración `018` aplicada en Railway, PR [#15](https://github.com/letsar-software/avizor/pull/15) mergeado.

## Fase 6 — Fenología parametrizable ([PR #8](https://github.com/letsar-software/avizor/pull/8), mergeado)

La fase que más tocaba producción: la fenología vivía hardcodeada en `lib/phenology/provider.ts` y pasa a ser dato administrable.

- Migración `015`: tabla `modelos_fenologicos`, sembrada con los coeficientes originales promovidos directo a `vigente` (cero cambio de comportamiento al migrar).
- `PhenologyProvider` recibe los parámetros por constructor con el modelo original como default. `CalculatedPhenologyProvider` lee el modelo vigente de la base, con degradación segura al default si falla o no hay modelo.
- `lib/phenology/spec.ts` — de paso, eliminó una duplicación real (`grupoMadurez` estaba repetido dos veces en `validation.ts`).
- `/admin/fenologia`, `/admin/fenologia/nuevo` (precargado con el modelo vigente), `/admin/fenologia/[id]`.
- **Verificación extra**: además de 5 tests nuevos (`tests/phenologia.test.ts`), se corrió `ConsultaService.ejecutar()` completo contra Railway confirmando que el resultado es idéntico al cálculo hardcodeado original.
- **Fuera de esta fase**: el set de hitos (E/R1/R3/R5/R7) queda fijo, no administrable.

**Hitos administrables (agregado 2026-08-26, rama `feature/fenologia-hitos-configurables`)**
- Confirmado que `PhenologyProvider.estimate()` ya era data-driven respecto de los hitos (`this.parametros.hitos.map(...)`, `offsets_dias` indexado posicionalmente) — la rigidez estaba solo en `lib/phenology/spec.ts` (`HITOS_FENOLOGICOS_CODIGOS`, un enum cerrado de 5 valores), en `lib/security/validation.ts` (longitud y orden fijos) y en la UI/página pública, no en el motor de cómputo.
- `lib/phenology/spec.ts`: reemplaza el enum cerrado por `HITO_FENOLOGICO_CODIGO_PATTERN` (mismo formato de estadio V/R que ya usa `lib/pests/engine.ts`) y límites `HITOS_FENOLOGICOS_MIN`/`MAX` (1 a 12).
- `lib/security/validation.ts`: `parametrosFenologicosSchema` valida una cantidad variable de hitos (con códigos únicos y formato válido) y cruza, vía `superRefine`, que `offsets_dias[grupo]` tenga exactamente un valor por hito en cada grupo de madurez — antes exigía longitud y orden fijos (`.length(5)`, `E,R1,R3,R5,R7`).
- `components/admin/fenologia/useModeloParametrosEditor.ts` suma `addHito`/`removeHito`/`updateHitoCodigo`/`updateHitoNombre`, manteniendo `offsets_dias` sincronizado en los cuatro grupos de madurez a la vez (agregar o quitar un hito nunca deja un grupo desalineado). `ParametrosGrid.tsx` muestra inputs de código/nombre editables por columna y los controles de agregar/quitar.
- `/resultado/fenologia`: la línea de tiempo tenía `sm:grid-cols-5` hardcodeado en Tailwind (no se puede interpolar una clase dinámica); pasa a `gridTemplateColumns` inline calculado por `data.hitos.length`.
- **Verificado en producción (2026-08-26)**: se creó un modelo real con 6 hitos (E, R1, R3, R5, R7, R8) desde `/admin/fenologia/nuevo` contra Railway, se confirmó que `offsets_dias` quedó guardado correctamente para los 4 grupos de madurez, y se borró después. Se verificó también `/resultado/fenologia` con datos de 3 hitos (`VE`, `V6`, `R2`) confirmando que la grilla se adapta (`grid-template-columns: repeat(3, ...)`).
- Suma 5 tests: `PhenologyProvider` con un set de hitos distinto (3 hitos, códigos `VE`/`V6`/`R2`) y 4 casos de `parametrosFenologicosSchema` (cantidad variable, `offsets_dias` desalineado, códigos repetidos, formato inválido).

## Fase 7 — Estado del sistema y Configuración ([PR #9](https://github.com/letsar-software/avizor/pull/9), mergeado)

- `/admin/estado-sistema`: chequeos reales contra la base (conectividad, latencia, versión de Postgres, filas por tabla clave) — a diferencia de la página pública `/estado-sistema`, que siempre muestra "Activo" hardcodeado.
- `/admin/configuracion`: solo lectura de feature flags (reutiliza `lib/config/featureFlags.ts`) y config operativa. `lib/sistema/config-snapshot.ts` nunca devuelve el valor de un secreto.
- `components/admin/StatCard.tsx` promovido desde `dashboard/` ahora que lo usa una segunda feature.
- **Deliberadamente no construido**: Notificaciones e Integraciones no tienen CRUD ficticio — no hay infraestructura de envío ni integraciones de terceros en el código, y el plan no especifica qué eventos notificar ni con qué sistemas integrar. Cada página deja un aviso (`NotConfiguredNotice`) con lo que falta definir.

## Hallazgo: dos motores de plagas en paralelo (resuelto)

Durante el desarrollo de este plan, un commit ajeno (`bd66ed7 feat(plagas): integrar reglas agronómicas y resultados frontend`, ya en `main`) agregó `lib/pests/` (`engine.ts`, `repository.ts`, `zone-resolver.ts`) y la tabla `reglas_plagas` (migración `013_soja_plagas_rules.sql`), con su propia resolución de zona-desde-localidad. `lib/consultas/service.ts` usaba **ambos** motores: `RulesEngineV2` (clima/enfermedades, `reglas_agronomicas`) y `PestRulesEngine` (plagas, `reglas_plagas`).

Esto dejaba al motor de aplicabilidad de la Fase 2 (`lib/rules/aplicabilidad.ts`, pensado para vivir dentro de `reglas_agronomicas`) sin conectar al flujo real de plagas.

**Decisión (2026-08-25):** se elige `lib/pests/` (motor de `bd66ed7`) como el motor de plagas que va — es el que efectivamente corre en producción y el único con datos reales sembrados (migración `013`, reglas P-01 a P-05). Se retira la capacidad no usada de la Fase 2:

- Se eliminó `lib/rules/aplicabilidad.ts` y su test (`tests/aplicabilidad.test.ts`).
- `lib/rules/engine-v2.ts` deja de recibir un `context` de aplicabilidad y de resolver `tipo_regla`; vuelve a ser puramente el motor de clima/enfermedades sobre `reglas_agronomicas` (sin cambio de comportamiento: ninguna fila real llegaba a usar esa rama, `repository-v2.ts` ni siquiera seleccionaba esas columnas).
- Se sacaron de `types/index.ts` los tipos `ZonaModoAplicabilidad`/`AplicabilidadDefinicion`/`ContextoEvaluacion`/`ResultadoAplicabilidad` y los campos `tipo_regla`/`grupo_plaga`/`especie`/`nivel_evidencia_climatica`/`aplicabilidad` de `ReglaAgronomicaV2` (el `TipoRegla`/`TIPOS_REGLA` de `catalogo_plagas` se mantiene, es de otro modelo).
- Se sacó `aplicabilidadSchema` de `lib/security/validation.ts` y `ZONA_MODOS_APLICABILIDAD` de `lib/rules/condition-spec.ts`.
- Migración `016_retira_columnas_plagas_reglas_agronomicas.sql`: dropea `tipo_regla`/`grupo_plaga`/`especie`/`nivel_evidencia_climatica` (y su índice) de `reglas_agronomicas`. Sin pérdida de datos: ninguna fila real usó nunca esas columnas.

El catálogo administrable de plagas (`/admin/plagas`, `/admin/plagas/[id]`, `/admin/zonas`) sigue vigente sin cambios, porque `lib/pests/` sí lee `catalogo_plagas`/`plagas_regionales`/`zonas_agronomicas` (migración `012`).

## Bug: `resolveAgronomicZone` referenciaba columnas inexistentes (resuelto, 2026-08-26)

`lib/pests/zone-resolver.ts` filtraba `where z.estado in ('revisada','vigente')` y ordenaba `by z.version desc` sobre `zonas_agronomicas` — esa tabla (migración `012`) nunca tuvo columnas `estado` ni `version`, solo `activa boolean`. La query fallaba con `column z.estado does not exist` (Postgres 42703) apenas se invocaba.

El bug nunca se manifestó para usuarios reales porque `resolveAgronomicZone` solo se llama cuando `ENABLE_PLAGAS=true` (`lib/consultas/service.ts`), y esa variable no está seteada en Railway producción (confirmado vía `get-service-config` del MCP de Railway) — toda la sección de plagas del flujo público está apagada hoy por el flag, no por este bug, pero lo hubiera roto con un 500 en cuanto alguien lo prendiera.

- Fix: `z.activa = true` en vez de `z.estado in (...)`, `order by z.clave` (determinístico) en vez de `z.version desc`.
- `tests/pests-zone-resolver.test.ts` (nuevo): parsea las columnas reales del `create table zonas_agronomicas` de la migración y valida que la query no referencie ninguna otra — confirmado que sin el fix este test falla con el mismo error, y con el fix pasa.
- Verificado además corriendo ambas versiones de la query (la rota y la corregida) directo contra Postgres de producción: la vieja reproduce `column z.estado does not exist` exacto, la nueva devuelve 0 filas sin error (esperado: las 7 zonas siguen con `definicion_geografica: null`, PEND-10 sigue sin resolver).