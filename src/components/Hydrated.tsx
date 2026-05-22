'use client';

import { useEffect, useState, type ReactNode } from 'react';

export function Hydrated({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return <div className="py-10 text-center text-muted text-sm">Cargando…</div>;
  }
  return <>{children}</>;
}
