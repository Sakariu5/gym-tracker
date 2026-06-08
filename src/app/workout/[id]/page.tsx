'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Hydrated } from '@/components/Hydrated';
import { useStore } from '@/store/useStore';
import type { Exercise, Workout, WorkoutSet } from '@/types';
import { estimated1RM } from '@/lib/calculations';
import { formatDuration } from '@/lib/format';

export default function WorkoutActivePage() {
  return (
    <Hydrated>
      <WorkoutActive />
    </Hydrated>
  );
}

function WorkoutActive() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const workout = useStore((s) => s.workouts.find((w) => w.id === params.id));
  const exercises = useStore((s) => s.exercises);
  const endWorkout = useStore((s) => s.endWorkout);
  const deleteWorkout = useStore((s) => s.deleteWorkout);
  const renameWorkout = useStore((s) => s.renameWorkout);

  const [picking, setPicking] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(workout?.name ?? '');

  if (!workout) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted">No se encontró el entrenamiento.</p>
        <Link href="/workout">
          <Button variant="ghost" className="mt-4">
            Volver
          </Button>
        </Link>
      </div>
    );
  }

  const finished = !!workout.endedAt;

  const exerciseOrder: string[] = [];
  for (const s of workout.sets) {
    if (!exerciseOrder.includes(s.exerciseId)) exerciseOrder.push(s.exerciseId);
  }

  return (
    <div className="py-6 space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {renaming ? (
            <div className="flex gap-2">
              <Input
                value={nameDraft}
                autoFocus
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => {
                  if (nameDraft.trim()) renameWorkout(workout.id, nameDraft.trim());
                  setRenaming(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (nameDraft.trim())
                      renameWorkout(workout.id, nameDraft.trim());
                    setRenaming(false);
                  }
                }}
              />
            </div>
          ) : (
            <h1
              onClick={() => !finished && setRenaming(true)}
              className="text-3xl font-bold tracking-tight"
            >
              {workout.name}
            </h1>
          )}
          <p className="text-sm text-muted mt-0.5">
            {finished
              ? `Finalizado · ${formatDuration(workout.startedAt, workout.endedAt)}`
              : `En curso · ${workout.sets.filter((s) => s.completed).length} sets`}
          </p>
        </div>
        <Link href="/workout">
          <button className="text-muted text-2xl leading-none px-2">×</button>
        </Link>
      </header>

      {exerciseOrder.map((exId) => {
        const ex = exercises.find((e) => e.id === exId);
        if (!ex) return null;
        const sets = workout.sets.filter((s) => s.exerciseId === exId);
        return (
          <ExerciseBlock
            key={exId}
            exercise={ex}
            sets={sets}
            workout={workout}
            readonly={finished}
          />
        );
      })}

      {workout.notes && (
        <Card>
          <div className="text-xs text-muted uppercase tracking-wide mb-2">
            Resumen
          </div>
          <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-300">
            {workout.notes}
          </pre>
        </Card>
      )}

      {!finished && (
        <>
          <Button variant="secondary" onClick={() => setPicking(true)}>
            + Añadir ejercicio
          </Button>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm('¿Descartar este entrenamiento?')) {
                  deleteWorkout(workout.id);
                  router.push('/workout');
                }
              }}
            >
              Descartar
            </Button>
            <Button
              onClick={() => {
                endWorkout(workout.id);
                router.push('/');
              }}
            >
              Terminar
            </Button>
          </div>
        </>
      )}

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            useStore.getState().addSet(workout.id, ex.id, 0, 0);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

function ExerciseBlock({
  exercise,
  sets,
  workout,
  readonly,
}: {
  exercise: Exercise;
  sets: WorkoutSet[];
  workout: Workout;
  readonly: boolean;
}) {
  const updateSet = useStore((s) => s.updateSet);
  const addSet = useStore((s) => s.addSet);
  const removeSet = useStore((s) => s.removeSet);
  const repeatPrevious = useStore((s) => s.repeatPrevious);
  const allWorkouts = useStore((s) => s.workouts);

  const previous = useMemo(() => {
    for (let i = allWorkouts.length - 1; i >= 0; i--) {
      const w = allWorkouts[i];
      if (w.id === workout.id) continue;
      const ws = w.sets.filter((s) => s.exerciseId === exercise.id);
      if (ws.length) return { workoutDate: w.date, sets: ws };
    }
    return null;
  }, [allWorkouts, exercise.id, workout.id]);

  const best = sets.reduce(
    (m, s) => (s.completed ? Math.max(m, estimated1RM(s.weight, s.reps)) : m),
    0,
  );

  const onAddSet = () => {
    const last = sets[sets.length - 1];
    addSet(
      workout.id,
      exercise.id,
      last?.weight ?? previous?.sets[0]?.weight ?? 0,
      last?.reps ?? previous?.sets[0]?.reps ?? 0,
    );
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold">{exercise.name}</div>
          <div className="text-xs text-muted">{exercise.muscleGroup}</div>
        </div>
        {best > 0 && (
          <div className="text-right">
            <div className="text-xs text-muted">1RM est.</div>
            <div className="font-semibold">{best.toFixed(1)} kg</div>
          </div>
        )}
      </div>

      {previous && !readonly && (
        <div className="mt-3 text-xs text-muted flex items-center justify-between gap-2">
          <span>
            Anterior:{' '}
            {previous.sets
              .map((s) => `${s.weight}×${s.reps}`)
              .join(' · ')}
          </span>
          {sets.length === 0 && (
            <button
              onClick={() => repeatPrevious(workout.id, exercise.id)}
              className="text-accent font-medium"
            >
              Repetir
            </button>
          )}
        </div>
      )}

      {readonly ? (
        <ReadonlySets sets={sets} />
      ) : (
        <div className="mt-3 space-y-1.5">
          <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 text-xs text-muted uppercase px-1">
            <div>#</div>
            <div className="text-center">Peso</div>
            <div className="text-center">Reps</div>
            <div className="text-center">✓</div>
          </div>
          {sets.length === 0 && (
            <div className="text-sm text-muted text-center py-2">
              Sin sets todavía
            </div>
          )}
          {sets.map((s, i) => (
            <SetRow
              key={s.id}
              index={i + 1}
              set={s}
              readonly={readonly}
              onChange={(patch) => updateSet(workout.id, s.id, patch)}
              onRemove={() => removeSet(workout.id, s.id)}
            />
          ))}
        </div>
      )}

      {!readonly && (
        <button
          onClick={onAddSet}
          className="mt-3 w-full py-2.5 text-sm rounded-xl border border-dashed border-borderAlt text-muted active:bg-surfaceAlt"
        >
          + Set
        </button>
      )}
    </Card>
  );
}

function setLabel(s: WorkoutSet): string {
  const unit = s.unit ?? 'kg';
  return `${s.weight} ${unit}${s.perSide ? '/lado' : ''} × ${s.reps}`;
}

function ReadonlySets({ sets }: { sets: WorkoutSet[] }) {
  if (sets.length === 0) {
    return (
      <div className="mt-3 text-sm text-muted text-center py-2">Sin sets</div>
    );
  }

  type Row =
    | { kind: 'set'; set: WorkoutSet; n: number }
    | { kind: 'drop'; sets: WorkoutSet[] };
  const rows: Row[] = [];
  let n = 0;
  let i = 0;
  while (i < sets.length) {
    const s = sets[i];
    if (s.dropGroup === undefined) {
      n++;
      rows.push({ kind: 'set', set: s, n });
      i++;
    } else {
      const group = s.dropGroup;
      const dropSets: WorkoutSet[] = [];
      while (i < sets.length && sets[i].dropGroup === group) {
        dropSets.push(sets[i]);
        i++;
      }
      rows.push({ kind: 'drop', sets: dropSets });
    }
  }

  return (
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
              {row.sets.map((s) => (
                <span key={s.id} className="text-zinc-300">
                  {setLabel(s)}
                </span>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function SetRow({
  index,
  set,
  readonly,
  onChange,
  onRemove,
}: {
  index: number;
  set: WorkoutSet;
  readonly: boolean;
  onChange: (patch: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'completed'>>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 items-center">
      <button
        onClick={() => !readonly && confirm('Eliminar set?') && onRemove()}
        disabled={readonly}
        className="text-muted text-sm"
      >
        {index}
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={set.weight || ''}
        placeholder="kg"
        disabled={readonly}
        onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
        className="bg-surfaceAlt border border-borderAlt rounded-lg px-2 py-2.5 text-center outline-none focus:border-accent disabled:opacity-60"
      />
      <input
        type="number"
        inputMode="numeric"
        value={set.reps || ''}
        placeholder="reps"
        disabled={readonly}
        onChange={(e) => onChange({ reps: parseInt(e.target.value, 10) || 0 })}
        className="bg-surfaceAlt border border-borderAlt rounded-lg px-2 py-2.5 text-center outline-none focus:border-accent disabled:opacity-60"
      />
      <button
        onClick={() => !readonly && onChange({ completed: !set.completed })}
        disabled={readonly}
        className={`h-10 rounded-lg border transition-colors ${
          set.completed
            ? 'bg-emerald-500 border-emerald-500 text-black font-bold'
            : 'border-borderAlt text-muted'
        }`}
      >
        {set.completed ? '✓' : ''}
      </button>
    </div>
  );
}

function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (ex: Exercise) => void;
  onClose: () => void;
}) {
  const exercises = useStore((s) => s.exercises);
  const addExercise = useStore((s) => s.addExercise);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return exercises;
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(t) ||
        e.muscleGroup.toLowerCase().includes(t),
    );
  }, [q, exercises]);

  const onCreate = () => {
    const name = q.trim();
    if (!name) return;
    const id = addExercise(name, 'otro');
    const created = useStore.getState().exercises.find((e) => e.id === id);
    if (created) onPick(created);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border-t border-border rounded-t-3xl w-full max-w-md mx-auto max-h-[80vh] flex flex-col"
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">Ejercicio</h3>
            <button onClick={onClose} className="text-muted text-2xl">
              ×
            </button>
          </div>
          <Input
            autoFocus
            placeholder="Buscar o crear…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="overflow-y-auto p-2">
          {filtered.length === 0 && q.trim() && (
            <button
              onClick={onCreate}
              className="w-full p-3 text-left text-accent"
            >
              + Crear &ldquo;{q.trim()}&rdquo;
            </button>
          )}
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className="w-full p-3 text-left rounded-xl active:bg-surfaceAlt"
            >
              <div className="font-medium">{ex.name}</div>
              <div className="text-xs text-muted">{ex.muscleGroup}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
