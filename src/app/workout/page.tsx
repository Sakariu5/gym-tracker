'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Hydrated } from '@/components/Hydrated';
import { useStore } from '@/store/useStore';
import { formatRelativeDay, formatDuration } from '@/lib/format';

export default function WorkoutListPage() {
  return (
    <Hydrated>
      <WorkoutList />
    </Hydrated>
  );
}

function WorkoutList() {
  const workouts = useStore((s) => s.workouts);
  const startWorkout = useStore((s) => s.startWorkout);
  const router = useRouter();
  const [name, setName] = useState('');

  const active = workouts.find((w) => !w.endedAt);
  const history = workouts
    .filter((w) => w.endedAt)
    .slice()
    .reverse();

  const previousNames = Array.from(
    new Set(workouts.filter((w) => w.endedAt).map((w) => w.name)),
  ).slice(0, 6);

  const onStart = (n?: string) => {
    const id = startWorkout(n?.trim() || name.trim() || 'Sesión');
    router.push(`/workout/${id}`);
  };

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Entrenamiento</h1>

      {active && (
        <Card className="border-accent/40 bg-accent/5">
          <div className="text-xs text-accent uppercase tracking-wide">
            En progreso
          </div>
          <div className="font-bold text-lg mt-0.5">{active.name}</div>
          <div className="text-sm text-muted">
            {active.sets.length} sets registrados
          </div>
          <Link href={`/workout/${active.id}`} className="block mt-3">
            <Button>Continuar →</Button>
          </Link>
        </Card>
      )}

      {!active && (
        <Card>
          <div className="font-semibold">Empezar sesión</div>
          <div className="mt-3 space-y-3">
            <Input
              placeholder="Nombre (ej. Push day, Pierna)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={() => onStart()}>Empezar</Button>
            <Link href="/workout/paste" className="block">
              <Button variant="secondary">📋 Pegar entreno desde texto</Button>
            </Link>
          </div>
          {previousNames.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-muted uppercase tracking-wide mb-2">
                Repetir
              </div>
              <div className="flex flex-wrap gap-2">
                {previousNames.map((n) => (
                  <button
                    key={n}
                    onClick={() => onStart(n)}
                    className="px-3 py-1.5 rounded-full bg-surfaceAlt border border-borderAlt text-sm active:bg-zinc-800"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div>
        <h2 className="font-semibold text-lg mb-2">Historial</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Sin entrenamientos aún.</p>
        ) : (
          <div className="space-y-2">
            {history.map((w) => (
              <Link key={w.id} href={`/workout/${w.id}`}>
                <Card className="active:bg-surfaceAlt transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{w.name}</div>
                      <div className="text-sm text-muted">
                        {formatRelativeDay(w.date)} ·{' '}
                        {formatDuration(w.startedAt, w.endedAt)} ·{' '}
                        {w.sets.filter((s) => s.completed).length} sets
                      </div>
                    </div>
                    <div className="text-muted">→</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
