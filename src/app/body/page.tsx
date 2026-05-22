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
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Hydrated } from '@/components/Hydrated';
import { StatCard } from '@/components/StatCard';
import { useStore } from '@/store/useStore';
import {
  latestBodyMetric,
  todayISO,
  weightSeries,
} from '@/lib/calculations';
import { formatDate } from '@/lib/format';

export default function BodyPage() {
  return (
    <Hydrated>
      <Body />
    </Hydrated>
  );
}

function Body() {
  const bodyMetrics = useStore((s) => s.bodyMetrics);
  const addBodyMetric = useStore((s) => s.addBodyMetric);
  const deleteBodyMetric = useStore((s) => s.deleteBodyMetric);
  const goals = useStore((s) => s.profile.goals);

  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [waist, setWaist] = useState('');

  const onSubmit = () => {
    const payload = {
      date: todayISO(),
      weight: weight ? parseFloat(weight) : undefined,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
    };
    if (
      payload.weight === undefined &&
      payload.bodyFat === undefined &&
      payload.muscleMass === undefined &&
      payload.waist === undefined
    )
      return;
    addBodyMetric(payload);
    setWeight('');
    setBodyFat('');
    setMuscleMass('');
    setWaist('');
    setOpen(false);
  };

  const lastWeight = latestBodyMetric(bodyMetrics, 'weight');
  const lastBodyFat = latestBodyMetric(bodyMetrics, 'bodyFat');
  const lastMuscle = latestBodyMetric(bodyMetrics, 'muscleMass');
  const lastWaist = latestBodyMetric(bodyMetrics, 'waist');

  const wSeries = useMemo(() => weightSeries(bodyMetrics), [bodyMetrics]);

  const recent = useMemo(() => [...bodyMetrics].reverse().slice(0, 30), [bodyMetrics]);

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Cuerpo</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Peso"
          value={lastWeight ? `${lastWeight} kg` : '—'}
          hint={goals.weight ? `meta ${goals.weight} kg` : undefined}
        />
        <StatCard
          label="Grasa"
          value={lastBodyFat ? `${lastBodyFat}%` : '—'}
          hint={goals.bodyFat ? `meta ${goals.bodyFat}%` : undefined}
        />
        <StatCard
          label="Músculo"
          value={lastMuscle ? `${lastMuscle} kg` : '—'}
        />
        <StatCard
          label="Cintura"
          value={lastWaist ? `${lastWaist} cm` : '—'}
        />
      </div>

      <Button onClick={() => setOpen(true)}>+ Registrar medidas</Button>

      {wSeries.length >= 2 && (
        <Card>
          <h2 className="font-semibold mb-3">Peso · tendencia 7 días</h2>
          <div className="h-48">
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
                    color: 'white',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#22D3EE"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Peso"
                />
                <Line
                  type="monotone"
                  dataKey="ma7"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  name="Media 7d"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {recent.length > 0 && (
        <div>
          <h2 className="text-sm uppercase text-muted mb-2">Historial</h2>
          <div className="space-y-2">
            {recent.map((m) => (
              <Card key={m.id} padded={false} className="px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{formatDate(m.date)}</div>
                    <div className="text-xs text-muted">
                      {[
                        m.weight && `${m.weight} kg`,
                        m.bodyFat && `${m.bodyFat}% grasa`,
                        m.muscleMass && `${m.muscleMass} kg músculo`,
                        m.waist && `${m.waist} cm cintura`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteBodyMetric(m.id)}
                    className="text-red-400 text-xl px-2"
                  >
                    ×
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-t border-border rounded-t-3xl w-full max-w-md mx-auto p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Registrar</h3>
              <button onClick={() => setOpen(false)} className="text-muted text-2xl">
                ×
              </button>
            </div>
            <Input
              label="Peso (kg)"
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <Input
              label="Grasa corporal (%)"
              type="number"
              inputMode="decimal"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
            <Input
              label="Masa muscular (kg)"
              type="number"
              inputMode="decimal"
              value={muscleMass}
              onChange={(e) => setMuscleMass(e.target.value)}
            />
            <Input
              label="Cintura (cm)"
              type="number"
              inputMode="decimal"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
            />
            <Button onClick={onSubmit}>Guardar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
