// Crea o actualiza un usuario del panel admin (bootstrap manual, sin flujo de invitación todavía).
// Uso: node scripts/create-admin-user.js <email> <nombre> <rol> <password>
// rol: administrador | agronomo | soporte
const { scryptSync, randomBytes } = require("node:crypto");
const { Pool } = require("pg");
const { checkServerIdentity } = require("node:tls");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const [, , email, nombre, rol, password] = process.argv;
if (!email || !nombre || !rol || !password) {
  console.error("Uso: node scripts/create-admin-user.js <email> <nombre> <rol> <password>");
  process.exit(1);
}
if (!["administrador", "agronomo", "soporte"].includes(rol)) {
  console.error("rol inválido: administrador | agronomo | soporte");
  process.exit(1);
}
if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
const databaseSsl = process.env.DATABASE_SSL === "true" || databaseUrl.includes("sslmode=require");
const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false";
const databaseCa = process.env.DATABASE_CA?.replace(/\\n/g, "\n");
const databaseTlsServerName = process.env.DATABASE_TLS_SERVER_NAME;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseSsl
    ? {
        rejectUnauthorized,
        ca: databaseCa,
        checkServerIdentity: databaseTlsServerName ? (_host, certificate) => checkServerIdentity(databaseTlsServerName, certificate) : undefined,
      }
    : undefined,
});

function hashPassword(rawPassword) {
  const salt = randomBytes(16);
  const hash = scryptSync(rawPassword, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

async function main() {
  const passwordHash = hashPassword(password);
  const result = await pool.query(
    `insert into usuarios_admin(email,nombre,rol,password_hash,estado)
     values($1,$2,$3,$4,'activo')
     on conflict(email) do update set nombre=excluded.nombre, rol=excluded.rol, password_hash=excluded.password_hash, estado='activo', updated_at=now()
     returning id,email,rol`,
    [email.trim().toLowerCase(), nombre, rol, passwordHash],
  );
  console.log("usuario_admin listo", result.rows[0]);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
