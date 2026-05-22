import type {
  BodyMetric,
  NutritionEntry,
  UserProfile,
  Workout,
  WorkoutSet,
} from '@/types';
import { todayISO } from '@/lib/calculations';
import { uid } from '@/lib/format';

// Lean bulk 72.3 → 80 kg @ ~10% BF, 5 días/sem PPL+UL.
// BMR Mifflin = 10·72.3 + 6.25·175 - 5·25 + 5 = 1697 kcal
// TDEE ×1.55 (moderado) = 2630 kcal · superávit suave +10% ≈ 2900 kcal
// Proteína 1.8 g/kg = 130 g · Grasa 1.0 g/kg = 72 g · Carbs ≈ 430 g
const PROFILE: UserProfile = {
  name: 'Germán',
  height: 175,
  goals: {
    weight: 80,
    bodyFat: 10,
    caloriesDaily: 2900,
    proteinDaily: 130,
  },
};

function germanBodyMetrics(): BodyMetric[] {
  return [
    {
      id: uid(),
      date: todayISO(),
      weight: 72.3,
      bodyFat: 10,
    },
  ];
}

function germanNutritionToday(): NutritionEntry[] {
  const today = todayISO();
  const createdAt = new Date().toISOString();
  const make = (
    foodName: string,
    mealType: NutritionEntry['mealType'],
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
  ): NutritionEntry => ({
    id: uid(),
    date: today,
    foodName,
    mealType,
    calories,
    protein,
    carbs,
    fat,
    createdAt,
  });
  return [
    make('4 huevos tibios', 'desayuno', 280, 24, 1, 20),
    make('Café', 'desayuno', 5, 0, 0, 0),
    make('Sardina', 'almuerzo', 60, 7, 0, 4),
    make('Fideo con crema (porción grande)', 'almuerzo', 660, 12, 55, 35),
  ];
}

function germanWorkoutInProgress(): Workout {
  const now = new Date().toISOString();
  const blueprint: Array<{ exerciseId: string; sets: number; reps: number }> = [
    { exerciseId: 'bench-press', sets: 4, reps: 8 },
    { exerciseId: 'incline-db-press', sets: 4, reps: 10 },
    { exerciseId: 'pec-fly', sets: 3, reps: 12 },
    { exerciseId: 'tricep-pushdown', sets: 3, reps: 12 },
    { exerciseId: 'skull-crusher', sets: 3, reps: 10 },
  ];
  const sets: WorkoutSet[] = [];
  for (const { exerciseId, sets: count, reps } of blueprint) {
    for (let i = 0; i < count; i++) {
      sets.push({
        id: uid(),
        exerciseId,
        weight: 0,
        reps,
        completed: false,
        createdAt: now,
      });
    }
  }
  return {
    id: uid(),
    name: 'Pecho + Tríceps',
    date: now,
    startedAt: now,
    sets,
  };
}

export interface GermanSeed {
  profile: UserProfile;
  bodyMetrics: BodyMetric[];
  nutrition: NutritionEntry[];
  workouts: Workout[];
}

export function germanInitialState(): GermanSeed {
  return {
    profile: PROFILE,
    bodyMetrics: germanBodyMetrics(),
    nutrition: germanNutritionToday(),
    workouts: [germanWorkoutInProgress()],
  };
}

export function isSeedEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SEED_DEMO !== 'false';
}
