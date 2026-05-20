export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'piernas'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'cardio'
  | 'otro';

export interface Exercise {
  id: number;
  name: string;
  muscleGroup: MuscleGroup;
  notes?: string;
}

export interface RoutineExercise {
  id: number;
  routineId: number;
  exerciseId: number;
  order: number;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  exercise?: Exercise;
}

export interface Routine {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  exercises?: RoutineExercise[];
}

export interface WorkoutSet {
  id: number;
  workoutId: number;
  exerciseId: number;
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  exercise?: Exercise;
}

export interface Workout {
  id: number;
  routineId?: number;
  routineName?: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  sets?: WorkoutSet[];
}
