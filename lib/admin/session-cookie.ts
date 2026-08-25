import { cookies } from "next/headers";

// Único punto del código que conoce el nombre de la cookie y la API de next/headers.
// Si el día de mañana cambia el mecanismo de transporte de la sesión (otro nombre,
// otro storage), el resto del panel no se entera: solo se toca este archivo.
const ADMIN_SESSION_COOKIE = "avizor_admin_session";

export async function setAdminSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function readAdminSessionToken() {
  return (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
}

export async function clearAdminSessionCookie() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}
