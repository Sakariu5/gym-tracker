import type { BodyMetric, NutritionEntry, Workout, WorkoutSet } from '@/types';

export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function bestSet1RM(sets: WorkoutSet[]): number {
  return sets.reduce((best, s) => {
    if (!s.completed) return best;
    const e = estimated1RM(s.weight, s.reps);
    return e > best ? e : best;
  }, 0);
}

export function workoutVolume(sets: WorkoutSet[]): number {
  return sets
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.weight * s.reps, 0);
}

export function movingAverage(values: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    out.push(avg);
  }
  return out;
}

export function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function sumMacros(entries: NutritionEntry[]): MacroTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function latestBodyMetric(
  metrics: BodyMetric[],
  field: keyof Pick<BodyMetric, 'weight' | 'bodyFat' | 'muscleMass' | 'waist'>,
): number | undefined {
  for (let i = metrics.length - 1; i >= 0; i--) {
    const v = metrics[i][field];
    if (typeof v === 'number') return v;
  }
  return undefined;
}

export function weightSeries(
  metrics: BodyMetric[],
): Array<{ date: string; weight: number; ma7: number }> {
  const withWeight = metrics
    .filter((m) => typeof m.weight === 'number')
    .sort((a, b) => a.date.localeCompare(b.date));
  const values = withWeight.map((m) => m.weight as number);
  const ma = movingAverage(values, 7);
  return withWeight.map((m, i) => ({
    date: m.date,
    weight: m.weight as number,
    ma7: ma[i],
  }));
}

export function exerciseProgress(
  workouts: Workout[],
  exerciseId: string,
): Array<{ date: string; oneRM: number; volume: number }> {
  return workouts
    .filter((w) => w.endedAt)
    .map((w) => {
      const sets = w.sets.filter((s) => s.exerciseId === exerciseId);
      return {
        date: w.date,
        oneRM: bestSet1RM(sets),
        volume: workoutVolume(sets),
      };
    })
    .filter((r) => r.oneRM > 0 || r.volume > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function streak(workouts: Workout[]): number {
  const dates = new Set(
    workouts.filter((w) => w.endedAt).map((w) => w.date.slice(0, 10)),
  );
  let s = 0;
  const cursor = new Date();
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (dates.has(iso)) {
      s++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      if (s === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const iso2 = cursor.toISOString().slice(0, 10);
        if (dates.has(iso2)) {
          s++;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }
  return s;
}
