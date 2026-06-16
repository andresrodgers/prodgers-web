import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "prodgers_session";

// Qué roles pueden acceder a cada portal
const PORTAL_ROLES: Record<string, string[]> = {
  "/prodgers": ["operativo", "admin"],
  "/instaladora": ["instaladora_propietario", "instaladora_gestor"],
  "/admin": ["admin"],
};

// Destino por defecto de cada rol tras el login
export function rolDestino(rol: string): string {
  if (rol === "admin") return "/admin/inicio";
  if (rol === "operativo") return "/prodgers/inicio";
  return "/instaladora/inicio";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Detectar qué portal protegido corresponde a esta ruta
  const portal = Object.keys(PORTAL_ROLES).find((p) => pathname.startsWith(p));
  if (!portal) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
    const { payload } = await jwtVerify(token, secret);
    const rol = payload.rol as string;

    if (!PORTAL_ROLES[portal].includes(rol)) {
      // Usuario autenticado pero en portal incorrecto → redirigir a su portal
      return NextResponse.redirect(new URL(rolDestino(rol), req.url));
    }

    return NextResponse.next();
  } catch {
    // Token inválido o expirado
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  }
}

export const config = {
  matcher: ["/prodgers/:path*", "/instaladora/:path*", "/admin/:path*"],
};
