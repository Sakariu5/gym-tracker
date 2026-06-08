'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  BodyMetric,
  Exercise,
  Favorite,
  NutritionEntry,
  UserProfile,
  Workout,
  WorkoutSet,
} from '@/types';
import { uid } from '@/lib/format';
import { SEED_EXERCISES } from '@/lib/seed';
import { normalizeName, type ParsedWorkout } from '@/lib/parseWorkout';

interface State {
  hydrated: boolean;
  exercises: Exercise[];
  workouts: Workout[];
  bodyMetrics: BodyMetric[];
  nutrition: NutritionEntry[];
  favorites: Favorite[];
  profile: UserProfile;

  setHydrated: () => void;

  startWorkout: (name?: string) => string;
  endWorkout: (id: string) => void;
  deleteWorkout: (id: string) => void;
  renameWorkout: (id: string, name: string) => void;

  addSet: (
    workoutId: string,
    exerciseId: string,
    weight: number,
    reps: number,
  ) => void;
  updateSet: (
    workoutId: string,
    setId: string,
    patch: Partial<Pick<WorkoutSet, 'weight' | 'reps' | 'rir' | 'completed'>>,
  ) => void;
  removeSet: (workoutId: string, setId: string) => void;
  repeatPrevious: (workoutId: string, exerciseId: string) => void;

  addExercise: (name: string, muscleGroup: Exercise['muscleGroup']) => string;
  importWorkout: (parsed: ParsedWorkout) => string;

  addBodyMetric: (m: Omit<BodyMetric, 'id'>) => void;
  deleteBodyMetric: (id: string) => void;

  addNutrition: (n: Omit<NutritionEntry, 'id' | 'createdAt'>) => void;
  deleteNutrition: (id: string) => void;
  addFavorite: (f: Omit<Favorite, 'id'>) => void;
  removeFavorite: (id: string) => void;

  setProfile: (p: Partial<UserProfile>) => void;
  setGoal: (k: keyof UserProfile['goals'], v: number | undefined) => void;

  reset: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      exercises: SEED_EXERCISES,
      workouts: [],
      bodyMetrics: [],
      nutrition: [],
      favorites: [],
      profile: { goals: {} },

      setHydrated: () => set({ hydrated: true }),

      startWorkout: (name) => {
        const id = uid();
        const now = new Date().toISOString();
        set((s) => ({
          workouts: [
            ...s.workouts,
            {
              id,
              name: name ?? 'Sesión',
              date: now,
              startedAt: now,
              sets: [],
            },
          ],
        }));
        return id;
      },

      endWorkout: (id) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === id ? { ...w, endedAt: new Date().toISOString() } : w,
          ),
        })),

      deleteWorkout: (id) =>
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      renameWorkout: (id, name) =>
        set((s) => ({
          workouts: s.workouts.map((w) => (w.id === id ? { ...w, name } : w)),
        })),

      addSet: (workoutId, exerciseId, weight, reps) => {
        const setObj: WorkoutSet = {
          id: uid(),
          exerciseId,
          weight,
          reps,
          completed: true,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId ? { ...w, sets: [...w.sets, setObj] } : w,
          ),
        }));
      },

      updateSet: (workoutId, setId, patch) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : {
                  ...w,
                  sets: w.sets.map((x) =>
                    x.id === setId ? { ...x, ...patch } : x,
                  ),
                },
          ),
        })),

      removeSet: (workoutId, setId) =>
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id !== workoutId
              ? w
              : { ...w, sets: w.sets.filter((x) => x.id !== setId) },
          ),
        })),

      repeatPrevious: (workoutId, exerciseId) => {
        const { workouts } = get();
        const previous = [...workouts]
          .reverse()
          .find(
            (w) =>
              w.id !== workoutId && w.sets.some((s) => s.exerciseId === exerciseId),
          );
        if (!previous) return;
        const prevSets = previous.sets.filter((s) => s.exerciseId === exerciseId);
        const now = new Date().toISOString();
        const cloned: WorkoutSet[] = prevSets.map((s) => ({
          id: uid(),
          exerciseId,
          weight: s.weight,
          reps: s.reps,
          completed: false,
          createdAt: now,
        }));
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === workoutId ? { ...w, sets: [...w.sets, ...cloned] } : w,
          ),
        }));
      },

      addExercise: (name, muscleGroup) => {
        const id = uid();
        set((s) => ({
          exercises: [...s.exercises, { id, name, muscleGroup }],
        }));
        return id;
      },

      importWorkout: (parsed) => {
        const workoutId = uid();
        const now = new Date().toISOString();
        const newExercises: Exercise[] = [];
        const sets: WorkoutSet[] = [];

        // Empareja con ejercicios existentes por nombre normalizado; si no, los crea.
        const resolveExercise = (
          name: string,
          muscleGroup: Exercise['muscleGroup'],
        ): string => {
          const target = normalizeName(name);
          const existing = [...get().exercises, ...newExercises].find(
            (e) => normalizeName(e.name) === target,
          );
          if (existing) return existing.id;
          const created: Exercise = { id: uid(), name: name.trim(), muscleGroup };
          newExercises.push(created);
          return created.id;
        };

        for (const ex of parsed.exercises) {
          const exerciseId = resolveExercise(ex.name, ex.muscleGroup);
          for (const s of ex.sets) {
            sets.push({
              id: uid(),
              exerciseId,
              weight: s.weight,
              reps: s.reps,
              unit: s.unit,
              perSide: s.perSide || undefined,
              dropGroup: s.dropGroup,
              completed: true,
              createdAt: parsed.date,
            });
          }
        }

        const workout: Workout = {
          id: workoutId,
          name: parsed.name,
          date: parsed.date,
          startedAt: parsed.date,
          endedAt: parsed.date,
          notes: parsed.notes,
          sets,
        };

        set((s) => ({
          exercises: [...s.exercises, ...newExercises],
          workouts: [...s.workouts, workout].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        }));
        return workoutId;
      },

      addBodyMetric: (m) =>
        set((s) => ({
          bodyMetrics: [...s.bodyMetrics, { id: uid(), ...m }].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        })),

      deleteBodyMetric: (id) =>
        set((s) => ({ bodyMetrics: s.bodyMetrics.filter((m) => m.id !== id) })),

      addNutrition: (n) =>
        set((s) => ({
          nutrition: [
            ...s.nutrition,
            { ...n, id: uid(), createdAt: new Date().toISOString() },
          ],
        })),

      deleteNutrition: (id) =>
        set((s) => ({ nutrition: s.nutrition.filter((n) => n.id !== id) })),

      addFavorite: (f) =>
        set((s) => ({ favorites: [...s.favorites, { ...f, id: uid() }] })),

      removeFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.filter((f) => f.id !== id) })),

      setProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p, goals: s.profile.goals } })),

      setGoal: (k, v) =>
        set((s) => ({
          profile: { ...s.profile, goals: { ...s.profile.goals, [k]: v } },
        })),

      reset: () =>
        set({
          workouts: [],
          bodyMetrics: [],
          nutrition: [],
          favorites: [],
          profile: { goals: {} },
        }),
    }),
    {
      name: 'gymtracker:v1',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
