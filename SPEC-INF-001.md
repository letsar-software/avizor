# Spec: INF-001 — Pipeline de CI obligatorio para pull requests

## Objetivo

Evitar que un pull request incorpore regresiones de lint, tipos, build, pruebas
unitarias o smoke tests E2E sin una señal automática y visible en GitHub.

Como persona revisando un PR, quiero ver un único check de validación que falle
ante cualquiera de esos errores antes de aprobar el merge.

### Alcance

- Ejecutar CI ante cada evento `pull_request`.
- Validar, en orden: lint, tipos, build, pruebas unitarias y smoke tests E2E.
- Proveer PostgreSQL 16 efímero y aplicar las migraciones antes de los E2E.
- Aislar toda operación de base de datos del CI a ese PostgreSQL efímero; CI no
  puede conectarse ni modificar Railway, producción ni ninguna base compartida.
- Instalar Python Playwright y Chromium dentro del runner.
- Crear comandos versionados para typecheck y E2E.
- Corregir el comando de test para que descubra las pruebas de forma portable en
  Node 20.
- Orquestar los scripts Python existentes contra una sola instancia local de la
  aplicación, aun cuando usen puertos históricos distintos.

### Fuera de alcance

- Configurar reglas de protección de ramas o required checks en GitHub/Railway.
- Cambiar producto, API, esquema de PostgreSQL o reglas agronómicas.
- Agregar suites E2E nuevas o reescribir los smoke tests existentes.
- Ejecutar migraciones sobre Railway u otra base compartida.

## Tech stack

- GitHub Actions sobre `ubuntu-latest`.
- Node.js 20, npm y Next.js 15.5.23.
- PostgreSQL 16 como service container del job.
- Python 3.12, Playwright Python y Chromium.
- TypeScript, ESLint y `tsx` ya presentes en el repositorio.

## Commands

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm test
npm run test:e2e
```

`npm run test:e2e` debe aplicar las migraciones únicamente al `DATABASE_URL`
local del servicio PostgreSQL efímero de CI, iniciar `npm start` con un puerto
local y finalizar sus procesos auxiliares incluso cuando un smoke test falle.

## Project structure

```text
.github/workflows/ci.yml    → workflow de validación de pull requests
package.json                → comandos typecheck, test y test:e2e
scripts/run-e2e-smoke.py    → runner E2E, migraciones, app y relays de puertos
tests/ci-workflow.test.ts   → contrato estático mínimo del workflow y scripts
scripts/*.py                → smoke tests existentes que el runner ejecuta
```

## Code style

El workflow debe ser explícito, con versiones de actions fijas y pasos
nombrados. Los comandos que alteran el entorno de CI se definen en
`package.json`; el workflow los invoca, sin duplicar su lógica.

```yaml
- name: Typecheck
  run: npm run typecheck
```

El runner Python debe usar tipos, constantes descriptivas y `try/finally` para
liberar relays y terminar Next.js. No debe ocultar fallas de los subprocesos:
una excepción o código de salida no nulo debe hacer fallar el job.

## Testing strategy

- Prueba de contrato: comprobar que el workflow se activa en PR, usa PostgreSQL
  16 y contiene los cinco pasos en el orden definido.
- Prueba de contrato: comprobar que los scripts npm requeridos invocan los
  comandos esperados y que el runner incluye todos los `scripts/*.py` de smoke.
- Verificación local: ejecutar lint, typecheck, build, tests y E2E contra un
  PostgreSQL descartable, sin usar `DATABASE_URL` de Railway, producción ni
  ninguna instancia compartida.
- Verificación remota: abrir un PR de prueba con una falla controlada de lint,
  tipo o test y confirmar que el check de CI queda rojo. Esta evidencia requiere
  configuración/acción en GitHub y no se simula localmente.

## Boundaries

- Always: ejecutar los pasos en el orden acordado; usar `npm ci`; desactivar
  telemetría de Next; usar credenciales no sensibles para el service container;
  definir `DATABASE_URL` exclusivamente dentro del job hacia el service
  container; propagar cualquier fallo; limpiar procesos E2E.
- Ask first: cambiar la versión de Node/PostgreSQL; agregar dependencias npm o
  Python persistentes; ampliar triggers más allá de `pull_request`; modificar
  CI existente; configurar protección de ramas; cambiar migraciones o esquema.
- Never: subir secretos, leer o usar credenciales de Railway, conectar,
  consultar, migrar o escribir en producción o en una base compartida, ignorar
  un fallo de pruebas ni editar tests para ocultar una regresión.

## Success criteria

1. Un PR dispara un workflow `CI` con un job visible de validación.
2. El job ejecuta exactamente en este orden: `npm run lint`, `npm run
   typecheck`, `npm run build`, `npm test`, `npm run test:e2e`.
3. El job cuenta con PostgreSQL 16 saludable, `DATABASE_URL` local,
   `DATABASE_SSL=false` y no requiere secretos externos.
4. El único destino de base de datos accesible al CI es su PostgreSQL 16
   efímero. Ni las migraciones ni los E2E reciben credenciales, URLs o acceso
   de red a producción, Railway o una base compartida.
5. El typecheck vive en el script `typecheck` y ejecuta `tsc --noEmit`.
6. `npm test` descubre todas las pruebas `tests/*.test.ts` en Node 20.
7. Los E2E instalan Playwright/Chromium, ejecutan las migraciones contra el
   servicio efímero, levantan una única aplicación y cubren todos los smoke
   scripts Python versionados.
8. Si falla lint, tipos, build, una prueba unitaria, una migración o un smoke
   test, el workflow termina con código distinto de cero y GitHub muestra el
   check en rojo.
9. Los cambios no alteran código de producto ni se despliegan a Railway.

## Open questions

- El workflow puede dejar un check rojo, pero convertirlo en requisito técnico
  de merge depende de las reglas de protección del repositorio. Se asume que
  esta tarea cubre el workflow y que el equipo activará la regla en GitHub si
  todavía no existe.
- Se asume que los `scripts/*.py` actuales son el conjunto E2E a conservar,
  incluidos los scripts que escriben capturas locales durante la corrida.
