'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card } from '@/components/Card';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/Button';
import { Hydrated } from '@/components/Hydrated';
import { useStore } from '@/store/useStore';
import {
  latestBodyMetric,
  streak,
  sumMacros,
  todayISO,
} from '@/lib/calculations';
import { formatRelativeDay } from '@/lib/format';

export default function HomePage() {
  return (
    <Hydrated>
      <Dashboard />
    </Hydrated>
  );
}

function Dashboard() {
  const workouts = useStore((s) => s.workouts);
  const bodyMetrics = useStore((s) => s.bodyMetrics);
  const nutrition = useStore((s) => s.nutrition);
  const goals = useStore((s) => s.profile.goals);

  const today = todayISO();

  const todayNutrition = useMemo(
    () => nutrition.filter((n) => n.date.slice(0, 10) === today),
    [nutrition, today],
  );

  const macros = useMemo(() => sumMacros(todayNutrition), [todayNutrition]);

  const lastWeight = latestBodyMetric(bodyMetrics, 'weight');
  const previousWeight = useMemo(() => {
    const withWeight = bodyMetrics.filter((m) => typeof m.weight === 'number');
    if (withWeight.length < 2) return undefined;
    return withWeight[withWeight.length - 2].weight;
  }, [bodyMetrics]);

  const weightTrend: 'up' | 'down' | 'flat' | undefined =
    lastWeight && previousWeight
      ? lastWeight > previousWeight
        ? 'up'
        : lastWeight < previousWeight
          ? 'down'
          : 'flat'
      : undefined;

  const activeWorkout = workouts.find((w) => !w.endedAt);
  const completedWorkouts = workouts.filter((w) => w.endedAt);
  const lastWorkout = completedWorkouts[completedWorkouts.length - 1];

  const s = streak(workouts);

  return (
    <div className="py-6 space-y-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hoy</h1>
          <p className="text-sm text-muted">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {s > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold">{s}🔥</div>
              <div className="text-xs text-muted">racha</div>
            </div>
          )}
          <Link
            href="/settings"
            className="text-2xl text-muted leading-none"
            aria-label="Ajustes"
          >
            ⚙
          </Link>
        </div>
      </header>

      {activeWorkout && (
        <Card className="border-accent/40 bg-accent/5">
          <div className="text-xs text-accent uppercase tracking-wide">
            En progreso
          </div>
          <div className="text-lg font-bold mt-0.5">{activeWorkout.name}</div>
          <div className="text-sm text-muted mt-0.5">
            {activeWorkout.sets.length} sets registrados
          </div>
          <Link href={`/workout/${activeWorkout.id}`} className="block mt-3">
            <Button>Continuar entrenamiento →</Button>
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Peso"
          value={lastWeight ? `${lastWeight} kg` : '—'}
          trend={weightTrend}
          hint={
            goals.weight ? `meta ${goals.weight} kg` : 'añade en Cuerpo'
          }
        />
        <StatCard
          label="Calorías"
          value={Math.round(macros.calories)}
          hint={
            goals.caloriesDaily
              ? `meta ${goals.caloriesDaily}`
              : 'añade en Ajustes'
          }
        />
        <StatCard
          label="Proteína"
          value={`${Math.round(macros.protein)} g`}
          hint={goals.proteinDaily ? `meta ${goals.proteinDaily} g` : undefined}
        />
        <StatCard
          label="Workouts 7d"
          value={
            workouts.filter(
              (w) =>
                w.endedAt &&
                new Date(w.date).getTime() >
                  Date.now() - 7 * 86400000,
            ).length
          }
        />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Entrenamiento</h2>
          <Link href="/workout" className="text-sm text-accent">
            Ver todos →
          </Link>
        </div>
        {lastWorkout ? (
          <div className="mt-3">
            <div className="text-sm text-muted">
              Último: {formatRelativeDay(lastWorkout.date)}
            </div>
            <div className="font-medium">{lastWorkout.name}</div>
            <div className="text-sm text-muted">
              {lastWorkout.sets.filter((s) => s.completed).length} sets ·{' '}
              {Math.round(
                lastWorkout.sets
                  .filter((s) => s.completed)
                  .reduce((a, b) => a + b.weight * b.reps, 0),
              )}{' '}
              kg·reps
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted mt-2">
            Aún sin entrenamientos. Empieza uno.
          </p>
        )}
        {!activeWorkout && (
          <Link href="/workout" className="block mt-4">
            <Button>Empezar entrenamiento</Button>
          </Link>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/nutrition">
          <Card className="active:bg-surfaceAlt transition-colors h-full">
            <div className="text-sm text-muted">Comida</div>
            <div className="mt-1 font-semibold">Registrar →</div>
          </Card>
        </Link>
        <Link href="/body">
          <Card className="active:bg-surfaceAlt transition-colors h-full">
            <div className="text-sm text-muted">Cuerpo</div>
            <div className="mt-1 font-semibold">Pesarte →</div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
