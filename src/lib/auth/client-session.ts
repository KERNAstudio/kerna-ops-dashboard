import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const CLIENT_SESSION_COOKIE = "kerna_client_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type ClientSessionPayload = {
  clientUserId: string;
  clientId: string;
  iat: number;
};

function sign(payloadB64: string): string {
  const secret = process.env.CLIENT_SESSION_SECRET!;
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function encode(payload: ClientSessionPayload): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

function decode(token: string): ClientSessionPayload | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = sign(payloadB64);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payloadB64, "base64url").toString());
  } catch {
    return null;
  }
}

// CLIENT_USERS don't go through Supabase Auth (see rbac migration) — this is their session,
// a signed httpOnly cookie carrying {clientUserId, clientId}. Not a JWT; no library needed.
export async function createClientSession(clientUserId: string, clientId: string) {
  const token = encode({ clientUserId, clientId, iat: Date.now() });
  const cookieStore = await cookies();
  cookieStore.set(CLIENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getClientSession(): Promise<ClientSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  return decode(token);
}

export async function clearClientSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CLIENT_SESSION_COOKIE);
}
