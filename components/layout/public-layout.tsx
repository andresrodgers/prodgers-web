import type { ReactNode } from "react";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(170deg, #11455e 0%, #0B2D3D 60%, #082230 100%)",
      }}
    >
      {children}
    </main>
  );
}
