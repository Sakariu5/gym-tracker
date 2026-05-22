'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/Card';
import { Hydrated } from '@/components/Hydrated';
import { StatCard } from '@/components/StatCard';
import { useStore } from '@/store/useStore';
import {
  exerciseProgress,
  sumMacros,
  weightSeries,
} from '@/lib/calculations';

export default function ProgressPage() {
  return (
    <Hydrated>
      <Progress />
    </Hydrated>
  );
}

function Progress() {
  const workouts = useStore((s) => s.workouts);
  const bodyMetrics = useStore((s) => s.bodyMetrics);
  const exercises = useStore((s) => s.exercises);
  const nutrition = useStore((s) => s.nutrition);
  const goals = useStore((s) => s.profile.goals);

  const exerciseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const w of workouts) {
      if (!w.endedAt) continue;
      for (const s of w.sets) ids.add(s.exerciseId);
    }
    return Array.from(ids);
  }, [workouts]);

  const [selectedExId, setSelectedExId] = useState<string | null>(null);
  const currentExId =
    selectedExId && exerciseIds.includes(selectedExId)
      ? selectedExId
      : exerciseIds[0] ?? null;

  const wSeries = useMemo(() => weightSeries(bodyMetrics), [bodyMetrics]);

  const exSeries = useMemo(
    () => (currentExId ? exerciseProgress(workouts, currentExId) : []),
    [workouts, currentExId],
  );

  const sevenDays = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return nutrition.filter((n) => new Date(n.date).getTime() >= cutoff);
  }, [nutrition]);

  const weeklyAvgCals = useMemo(() => {
    if (sevenDays.length === 0) return 0;
    const byDay = new Map<string, number>();
    for (const n of sevenDays) {
      const d = n.date.slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + n.calories);
    }
    const days = Array.from(byDay.values());
    return days.reduce((a, b) => a + b, 0) / days.length;
  }, [sevenDays]);

  const adherence = useMemo(() => {
    if (!goals.caloriesDaily) return null;
    const byDay = new Map<string, number>();
    for (const n of sevenDays) {
      const d = n.date.slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + n.calories);
    }
    const days = Array.from(byDay.values());
    if (days.length === 0) return 0;
    const within = days.filter(
      (d) => Math.abs(d - goals.caloriesDaily!) / goals.caloriesDaily! <= 0.1,
    ).length;
    return Math.round((within / days.length) * 100);
  }, [sevenDays, goals.caloriesDaily]);

  const completedWorkouts = workouts.filter((w) => w.endedAt);

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Progreso</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Workouts" value={completedWorkouts.length} />
        <StatCard
          label="Cals/día 7d"
          value={Math.round(weeklyAvgCals)}
          hint={goals.caloriesDaily ? `meta ${goals.caloriesDaily}` : undefined}
        />
        <StatCard
          label="Adherencia"
          value={adherence === null ? '—' : `${adherence}%`}
          hint="±10% meta calórica"
        />
        <StatCard
          label="Pesajes"
          value={bodyMetrics.filter((m) => m.weight !== undefined).length}
        />
      </div>

      {wSeries.length >= 2 && (
        <Card>
          <h2 className="font-semibold mb-3">Peso · 7d MA</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wSeries}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#8a8a8a', fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tick={{ fill: '#8a8a8a', fontSize: 10 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  contentStyle={{
                    background: '#111',
                    border: '1px solid #333',
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="ma7"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {exerciseIds.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Fuerza por ejercicio</h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {exerciseIds.map((id) => {
              const ex = exercises.find((e) => e.id === id);
              if (!ex) return null;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedExId(id)}
                  className={`px-3 py-1.5 text-xs rounded-full border ${
                    currentExId === id
                      ? 'bg-white text-black border-white'
                      : 'bg-surfaceAlt border-borderAlt text-muted'
                  }`}
                >
                  {ex.name}
                </button>
              );
            })}
          </div>
          {exSeries.length >= 1 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exSeries}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8a8a8a', fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5, 10)}
                  />
                  <YAxis tick={{ fill: '#8a8a8a', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#111',
                      border: '1px solid #333',
                      borderRadius: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="oneRM"
                    stroke="#22D3EE"
                    strokeWidth={2}
                    name="1RM est."
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted">Sin datos suficientes.</p>
          )}
        </Card>
      )}

      {completedWorkouts.length === 0 && bodyMetrics.length === 0 && (
        <Card>
          <p className="text-muted text-center">
            Aún sin datos. Registra entrenamientos y peso para ver tu progreso.
          </p>
        </Card>
      )}
    </div>
  );
}
