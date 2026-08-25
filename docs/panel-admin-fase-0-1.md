# Panel de administración — Fase 0 y Fase 1

Fecha: 2026-08-25
Ramas: `feature/panel-admin-autenticacion` (Fase 0, en remoto), `feature/panel-admin-reglas-laboratorio` (Fase 1, local)

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

**Fuera de esta fase**
- El flujo de "fork" para crear una nueva versión a partir de una regla vigente: el editor la bloquea pero todavía no ofrece el botón de "crear nueva versión".
- No se pudo probar el flujo con datos reales (login, listar, guardar) porque no hay `DATABASE_URL` en este entorno de desarrollo. Se verificó con `tsc`, `eslint`, `next build` limpios, y en el browser que las rutas nuevas respetan el guard sin sesión.