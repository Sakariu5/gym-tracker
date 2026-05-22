import type { Exercise } from '@/types';

export const SEED_EXERCISES: Exercise[] = [
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'pecho', equipment: 'barra' },
  { id: 'incline-db-press', name: 'Press inclinado con mancuernas', muscleGroup: 'pecho', equipment: 'mancuernas' },
  { id: 'pec-fly', name: 'Aperturas', muscleGroup: 'pecho', equipment: 'mancuernas' },
  { id: 'pullup', name: 'Dominadas', muscleGroup: 'espalda', equipment: 'corporal' },
  { id: 'barbell-row', name: 'Remo con barra', muscleGroup: 'espalda', equipment: 'barra' },
  { id: 'lat-pulldown', name: 'Jalón al pecho', muscleGroup: 'espalda', equipment: 'polea' },
  { id: 'deadlift', name: 'Peso muerto', muscleGroup: 'espalda', equipment: 'barra' },
  { id: 'squat', name: 'Sentadilla', muscleGroup: 'piernas', equipment: 'barra' },
  { id: 'leg-press', name: 'Prensa', muscleGroup: 'piernas', equipment: 'máquina' },
  { id: 'leg-curl', name: 'Curl femoral', muscleGroup: 'piernas', equipment: 'máquina' },
  { id: 'leg-extension', name: 'Extensión cuádriceps', muscleGroup: 'piernas', equipment: 'máquina' },
  { id: 'ohp', name: 'Press militar', muscleGroup: 'hombros', equipment: 'barra' },
  { id: 'lateral-raise', name: 'Elevaciones laterales', muscleGroup: 'hombros', equipment: 'mancuernas' },
  { id: 'face-pull', name: 'Face pull', muscleGroup: 'hombros', equipment: 'polea' },
  { id: 'barbell-curl', name: 'Curl con barra', muscleGroup: 'biceps', equipment: 'barra' },
  { id: 'hammer-curl', name: 'Curl martillo', muscleGroup: 'biceps', equipment: 'mancuernas' },
  { id: 'tricep-pushdown', name: 'Extensiones polea', muscleGroup: 'triceps', equipment: 'polea' },
  { id: 'skull-crusher', name: 'Press francés', muscleGroup: 'triceps', equipment: 'barra' },
  { id: 'plank', name: 'Plancha', muscleGroup: 'core', equipment: 'corporal' },
  { id: 'crunch', name: 'Crunch', muscleGroup: 'core', equipment: 'corporal' },
];
