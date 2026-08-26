import test from "node:test";
import assert from "node:assert/strict";
import { DomainError } from "../lib/consultas/service";
import { acceptAdminInvitation, createAdminInvitation, getAdminInvitation } from "../lib/admin/auth";
import type { query } from "../lib/db/postgres";

interface FakeUsuario { email: string; nombre: string; rol: string; estado: string; password_hash: string | null }
interface FakeInvitacion { id: string; usuario_id: string; token_hash: string; expira_en: string; aceptada_en: string | null }

// Mismo patrón de fake in-memory que tests/security-blockers.test.ts (fakeRateLimitDatabase):
// un queryImpl angosto, tallado a las consultas exactas que emite lib/admin/auth.ts, no un
// motor SQL genérico.
function fakeAdminDatabase() {
  const usuarios = new Map<string, FakeUsuario>();
  const invitaciones = new Map<string, FakeInvitacion>();
  let nextId = 1;

  function seedUsuario(estado: FakeUsuario["estado"] = "invitado") {
    const id = `usuario-${nextId++}`;
    usuarios.set(id, { email: `${id}@avizor.test`, nombre: "Natali", rol: "agronomo", estado, password_hash: null });
    return id;
  }

  const queryImpl = (async (sql: string, values: unknown[] = []) => {
    const text = sql.trim().toLowerCase();

    if (text.startsWith("insert into invitaciones_admin")) {
      const [usuarioId, tokenHash, expiraEn] = values as [string, string, string];
      const id = `inv-${nextId++}`;
      invitaciones.set(tokenHash, { id, usuario_id: usuarioId, token_hash: tokenHash, expira_en: expiraEn, aceptada_en: null });
      return { rows: [], rowCount: 1 } as never;
    }

    if (text.startsWith("select i.id, i.usuario_id")) {
      const [tokenHash] = values as [string];
      const invitacion = invitaciones.get(tokenHash);
      const usuario = invitacion ? usuarios.get(invitacion.usuario_id) : undefined;
      if (!invitacion || !usuario) return { rows: [], rowCount: 0 } as never;
      return {
        rows: [{ id: invitacion.id, usuario_id: invitacion.usuario_id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol, expira_en: invitacion.expira_en, aceptada_en: invitacion.aceptada_en, estado: usuario.estado }],
        rowCount: 1,
      } as never;
    }

    if (text.startsWith("update usuarios_admin set password_hash")) {
      const [id, passwordHash] = values as [string, string];
      const usuario = usuarios.get(id);
      if (usuario) { usuario.password_hash = passwordHash; usuario.estado = "activo"; }
      return { rows: [], rowCount: 1 } as never;
    }

    if (text.startsWith("update invitaciones_admin set aceptada_en")) {
      const [id] = values as [string];
      for (const invitacion of invitaciones.values()) if (invitacion.id === id) invitacion.aceptada_en = new Date().toISOString();
      return { rows: [], rowCount: 1 } as never;
    }

    throw new Error(`fakeAdminDatabase: query inesperada: ${sql}`);
  }) as typeof query;

  return { queryImpl, seedUsuario, usuarios, invitaciones };
}

test("crea una invitación y la resuelve con el token", async () => {
  const db = fakeAdminDatabase();
  const usuarioId = db.seedUsuario();
  const invitacion = await createAdminInvitation(usuarioId, db.queryImpl);

  const resuelta = await getAdminInvitation(invitacion.token, db.queryImpl);
  assert.ok(resuelta);
  assert.equal(resuelta!.usuarioId, usuarioId);
});

test("un token que no existe no resuelve nada", async () => {
  const db = fakeAdminDatabase();
  assert.equal(await getAdminInvitation("token-inventado", db.queryImpl), null);
});

test("una invitación vencida no es válida", async () => {
  const db = fakeAdminDatabase();
  const usuarioId = db.seedUsuario();
  const invitacion = await createAdminInvitation(usuarioId, db.queryImpl);
  for (const row of db.invitaciones.values()) row.expira_en = new Date(Date.now() - 1000).toISOString();

  assert.equal(await getAdminInvitation(invitacion.token, db.queryImpl), null);
});

test("una invitación ya aceptada no vuelve a resolver", async () => {
  const db = fakeAdminDatabase();
  const usuarioId = db.seedUsuario();
  const invitacion = await createAdminInvitation(usuarioId, db.queryImpl);
  await acceptAdminInvitation(invitacion.token, "una-contraseña-larga", db.queryImpl);

  assert.equal(await getAdminInvitation(invitacion.token, db.queryImpl), null);
});

test("si el usuario deja de estar invitado, el enlace deja de servir", async () => {
  const db = fakeAdminDatabase();
  const usuarioId = db.seedUsuario();
  const invitacion = await createAdminInvitation(usuarioId, db.queryImpl);
  db.usuarios.get(usuarioId)!.estado = "bloqueado";

  assert.equal(await getAdminInvitation(invitacion.token, db.queryImpl), null);
});

test("aceptar activa al usuario y fija su contraseña", async () => {
  const db = fakeAdminDatabase();
  const usuarioId = db.seedUsuario();
  const invitacion = await createAdminInvitation(usuarioId, db.queryImpl);

  const usuario = await acceptAdminInvitation(invitacion.token, "una-contraseña-larga", db.queryImpl);

  assert.equal(usuario.id, usuarioId);
  assert.equal(db.usuarios.get(usuarioId)!.estado, "activo");
  assert.ok(db.usuarios.get(usuarioId)!.password_hash);
});

test("aceptar con un token inválido rechaza con INVITACION_INVALIDA", async () => {
  const db = fakeAdminDatabase();
  await assert.rejects(
    () => acceptAdminInvitation("token-invalido", "una-contraseña-larga", db.queryImpl),
    (error: DomainError) => error.code === "INVITACION_INVALIDA" && error.status === 410,
  );
});
