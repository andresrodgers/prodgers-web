"use client";

import { useEffect, useState } from "react";

export type SessionData = {
  userId: string;
  nombre: string;
  rol: string;
  instaladoraId: string | null;
};

export function useSession() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((r) => {
        setSession(r.ok ? r.data : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { session, loading };
}
