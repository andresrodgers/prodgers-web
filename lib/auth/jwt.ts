import { SignJWT, jwtVerify } from "jose";

export type SessionPayload = {
  userId: string;
  rol: "instaladora_propietario" | "instaladora_gestor" | "operativo" | "admin";
  instaladoraId: string | null;
  nombre: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET no configurado");
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
