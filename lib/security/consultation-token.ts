import { randomBytes, createHash } from "node:crypto";
export function createInteractionToken() { return randomBytes(32).toString("hex"); }
export function hashInteractionToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
