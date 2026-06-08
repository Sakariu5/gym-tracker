'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Hydrated } from '@/components/Hydrated';
import { useStore } from '@/store/useStore';
import { formatDate } from '@/lib/format';
import {
  parseWorkoutText,
  isParseError,
  type ParsedExercise,
  type ParsedSet,
} from '@/lib/parseWorkout';

const EXAMPLE = `Pierna — 8 Jun 2026

Sentadilla Smith
* 20 kg/lado × 15
* 30 kg/lado × 10
* 35 kg/lado × 8
* Dropset:
    * 35 kg/lado × 4
    * 30 kg/lado × 5
    * 20 kg/lado × 8

Prensa 45°
* 80 kg/lado × 12
* 90 kg/lado × 8
* Dropset:
    * 90 kg/lado × 8
    * 80 kg/lado × 6
    * 60 kg/lado × 8
    * 40 kg/lado × 6

Peso Muerto Rumano
* 60 kg × 12
* 80 kg × 12
* 100 kg × 8
* 100 kg × 8
* Dropset:
    * 60 kg × 5

Curl Femoral
* 85 lb × 12
* 100 lb × 8
* Dropset:
    * 100 lb × 8
    * 70 lb × 5
    * 40 lb × 5

Pantorrilla
* 100 lb × 20
* 145 lb × 20
* 205 lb × 20
* 235 lb × 12
* 205 lb × 10
* 175 lb × 10
* 130 lb × 12
* 85 lb × 12

Resumen
* Cuádriceps: 10/10
* Femorales: 10/10
* Pantorrillas: 10/10
* Glúteos: 8.5/10
* Series efectivas: ~25+
* Duración estimada: 75–100 min
* Nivel de intensidad: Muy alto.`;

function setLabel(s: ParsedSet): string {
  const w = `${s.weight} ${s.unit}${s.perSide ? '/lado' : ''}`;
  return `${w} × ${s.reps}`;
}

export default function PasteWorkoutPage() {
  return (
    <Hydrated>
      <PasteWorkout />
    </Hydrated>
  );
}

function PasteWorkout() {
  const router = useRouter();
  const importWorkout = useStore((s) => s.importWorkout);
  const [text, setText] = useState('');

  const result = useMemo(
    () => (text.trim() ? parseWorkoutText(text) : null),
    [text],
  );
  const parsed = result && !isParseError(result) ? result : null;
  const error = result && isParseError(result) ? result.error : null;

  const onRegister = () => {
    if (!parsed) return;
    const id = importWorkout(parsed);
    router.push(`/workout/${id}`);
  };

  return (
    <div className="py-6 space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pegar entreno</h1>
          <p className="text-sm text-muted mt-0.5">
            Pega tus notas y se registran solas.
          </p>
        </div>
        <Link href="/workout">
          <button className="text-muted text-2xl leading-none px-2">×</button>
        </Link>
      </header>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Texto del entrenamiento</div>
          <button
            onClick={() => setText(EXAMPLE)}
            className="text-xs text-accent font-medium"
          >
            Usar ejemplo de hoy
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            'Pierna — 8 Jun 2026\n\nSentadilla Smith\n* 20 kg/lado × 15\n* 30 kg/lado × 10\n...'
          }
          rows={10}
          className="w-full bg-surfaceAlt border border-borderAlt rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-accent transition-colors font-mono leading-relaxed resize-y"
        />
        <details className="mt-3">
          <summary className="text-xs text-muted cursor-pointer">
            ¿Cómo escribir el formato?
          </summary>
          <ul className="mt-2 text-xs text-muted space-y-1 list-disc pl-4">
            <li>1ª línea: nombre y fecha, ej. «Pierna — 8 Jun 2026».</li>
            <li>Cada ejercicio en su propia línea.</li>
            <li>
              Cada serie: «<span className="text-white">peso</span> kg × reps».
              Admite <span className="text-white">lb</span> y{' '}
              <span className="text-white">/lado</span>.
            </li>
            <li>«Dropset:» agrupa las series que le siguen.</li>
            <li>Desde «Resumen» todo se guarda como notas.</li>
          </ul>
        </details>
      </Card>

      {error && (
        <Card className="border-red-500/40 bg-red-500/5">
          <div className="text-sm text-red-400">{error}</div>
        </Card>
      )}

      {parsed && (
        <>
          <div className="flex items-baseline justify-between px-1">
            <h2 className="font-semibold text-lg">Vista previa</h2>
            <span className="text-xs text-muted">
              {parsed.exercises.length} ejercicios · {parsed.totalSets} series
            </span>
          </div>

          <Card>
            <div className="font-bold text-lg">{parsed.name}</div>
            <div className="text-sm text-muted">{formatDate(parsed.date)}</div>
          </Card>

          {parsed.exercises.map((ex, idx) => (
            <ExercisePreview key={idx} exercise={ex} />
          ))}

          {parsed.notes && (
            <Card>
              <div className="text-xs text-muted uppercase tracking-wide mb-2">
                Notas
              </div>
              <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-300">
                {parsed.notes}
              </pre>
            </Card>
          )}

          <div className="sticky bottom-20 pt-2">
            <Button onClick={onRegister}>
              Registrar entrenamiento ({parsed.totalSets} series)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function ExercisePreview({ exercise }: { exercise: ParsedExercise }) {
  // Agrupa series sueltas y dropsets para mostrarlos juntos.
  type Row =
    | { kind: 'set'; set: ParsedSet; n: number }
    | { kind: 'drop'; sets: ParsedSet[] };
  const rows: Row[] = [];
  let n = 0;
  let i = 0;
  while (i < exercise.sets.length) {
    const s = exercise.sets[i];
    if (s.dropGroup === undefined) {
      n++;
      rows.push({ kind: 'set', set: s, n });
      i++;
    } else {
      const group = s.dropGroup;
      const dropSets: ParsedSet[] = [];
      while (i < exercise.sets.length && exercise.sets[i].dropGroup === group) {
        dropSets.push(exercise.sets[i]);
        i++;
      }
      rows.push({ kind: 'drop', sets: dropSets });
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="font-bold">{exercise.name}</div>
        <div className="text-xs text-muted">{exercise.muscleGroup}</div>
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        {rows.map((row, idx) =>
          row.kind === 'set' ? (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-muted w-5 text-xs">{row.n}</span>
              <span>{setLabel(row.set)}</span>
            </div>
          ) : (
            <div
              key={idx}
              className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2"
            >
              <div className="text-[11px] uppercase tracking-wide text-accent mb-1">
                Dropset
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {row.sets.map((s, j) => (
                  <span key={j} className="text-zinc-300">
                    {setLabel(s)}
                  </span>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </Card>
  );
}
