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

export type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'snack';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  weight: number;
  reps: number;
  rir?: number;
  completed: boolean;
  createdAt: string;
}

export interface Workout {
  id: string;
  name: string;
  date: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  sets: WorkoutSet[];
}

export interface BodyMetric {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  photoUrl?: string;
  notes?: string;
}

export interface NutritionEntry {
  id: string;
  date: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
  createdAt: string;
}

export interface Favorite {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Goals {
  weight?: number;
  bodyFat?: number;
  caloriesDaily?: number;
  proteinDaily?: number;
}

export interface UserProfile {
  name?: string;
  height?: number;
  goals: Goals;
}
