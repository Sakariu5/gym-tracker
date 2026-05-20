import * as SQLite from 'expo-sqlite';
import type {
  Exercise,
  MuscleGroup,
  Routine,
  RoutineExercise,
  Workout,
  WorkoutSet,
} from '@/types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('gymtracker.db');
  await initSchema(dbInstance);
  return dbInstance;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      "order" INTEGER NOT NULL,
      target_sets INTEGER NOT NULL DEFAULT 3,
      target_reps INTEGER NOT NULL DEFAULT 10,
      target_weight REAL,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id INTEGER,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      notes TEXT,
      FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL DEFAULT 0,
      weight REAL NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );
  `);

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises',
  );
  if (!row || row.count === 0) {
    await seedExercises(db);
  }
}

async function seedExercises(db: SQLite.SQLiteDatabase): Promise<void> {
  const seed: Array<[string, MuscleGroup]> = [
    ['Press de banca', 'pecho'],
    ['Press inclinado con mancuernas', 'pecho'],
    ['Aperturas con mancuernas', 'pecho'],
    ['Dominadas', 'espalda'],
    ['Remo con barra', 'espalda'],
    ['Jalón al pecho', 'espalda'],
    ['Sentadilla con barra', 'piernas'],
    ['Peso muerto', 'piernas'],
    ['Prensa de piernas', 'piernas'],
    ['Curl femoral', 'piernas'],
    ['Press militar', 'hombros'],
    ['Elevaciones laterales', 'hombros'],
    ['Curl de bíceps con barra', 'biceps'],
    ['Curl martillo', 'biceps'],
    ['Press francés', 'triceps'],
    ['Extensiones en polea', 'triceps'],
    ['Plancha', 'core'],
    ['Crunch abdominal', 'core'],
  ];
  for (const [name, group] of seed) {
    await db.runAsync(
      'INSERT INTO exercises (name, muscle_group) VALUES (?, ?)',
      name,
      group,
    );
  }
}

type ExerciseRow = {
  id: number;
  name: string;
  muscle_group: MuscleGroup;
  notes: string | null;
};

function rowToExercise(r: ExerciseRow): Exercise {
  return {
    id: r.id,
    name: r.name,
    muscleGroup: r.muscle_group,
    notes: r.notes ?? undefined,
  };
}

export async function listExercises(): Promise<Exercise[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ExerciseRow>(
    'SELECT * FROM exercises ORDER BY muscle_group, name',
  );
  return rows.map(rowToExercise);
}

export async function createExercise(
  name: string,
  muscleGroup: MuscleGroup,
  notes?: string,
): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO exercises (name, muscle_group, notes) VALUES (?, ?, ?)',
    name,
    muscleGroup,
    notes ?? null,
  );
  return res.lastInsertRowId;
}

type RoutineRow = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export async function listRoutines(): Promise<Routine[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RoutineRow>(
    'SELECT * FROM routines ORDER BY created_at DESC',
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    createdAt: r.created_at,
  }));
}

export async function getRoutine(id: number): Promise<Routine | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<RoutineRow>(
    'SELECT * FROM routines WHERE id = ?',
    id,
  );
  if (!row) return null;
  const exercises = await getRoutineExercises(id);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    exercises,
  };
}

export async function createRoutine(
  name: string,
  description?: string,
): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO routines (name, description) VALUES (?, ?)',
    name,
    description ?? null,
  );
  return res.lastInsertRowId;
}

export async function deleteRoutine(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM routines WHERE id = ?', id);
}

type RoutineExerciseRow = {
  id: number;
  routine_id: number;
  exercise_id: number;
  order: number;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
  ex_name: string;
  ex_muscle_group: MuscleGroup;
  ex_notes: string | null;
};

export async function getRoutineExercises(
  routineId: number,
): Promise<RoutineExercise[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RoutineExerciseRow>(
    `SELECT re.*, e.name AS ex_name, e.muscle_group AS ex_muscle_group, e.notes AS ex_notes
     FROM routine_exercises re
     JOIN exercises e ON e.id = re.exercise_id
     WHERE re.routine_id = ?
     ORDER BY re."order" ASC`,
    routineId,
  );
  return rows.map((r) => ({
    id: r.id,
    routineId: r.routine_id,
    exerciseId: r.exercise_id,
    order: r.order,
    targetSets: r.target_sets,
    targetReps: r.target_reps,
    targetWeight: r.target_weight ?? undefined,
    exercise: {
      id: r.exercise_id,
      name: r.ex_name,
      muscleGroup: r.ex_muscle_group,
      notes: r.ex_notes ?? undefined,
    },
  }));
}

export async function addExerciseToRoutine(
  routineId: number,
  exerciseId: number,
  targetSets: number,
  targetReps: number,
  targetWeight?: number,
): Promise<number> {
  const db = await getDb();
  const orderRow = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX("order"), 0) + 1 AS next FROM routine_exercises WHERE routine_id = ?',
    routineId,
  );
  const order = orderRow?.next ?? 1;
  const res = await db.runAsync(
    `INSERT INTO routine_exercises
     (routine_id, exercise_id, "order", target_sets, target_reps, target_weight)
     VALUES (?, ?, ?, ?, ?, ?)`,
    routineId,
    exerciseId,
    order,
    targetSets,
    targetReps,
    targetWeight ?? null,
  );
  return res.lastInsertRowId;
}

export async function removeRoutineExercise(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM routine_exercises WHERE id = ?', id);
}

export async function startWorkout(routineId?: number): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO workouts (routine_id) VALUES (?)',
    routineId ?? null,
  );
  const workoutId = res.lastInsertRowId;

  if (routineId) {
    const exercises = await getRoutineExercises(routineId);
    for (const re of exercises) {
      for (let i = 1; i <= re.targetSets; i++) {
        await db.runAsync(
          `INSERT INTO workout_sets
           (workout_id, exercise_id, set_number, reps, weight, completed)
           VALUES (?, ?, ?, ?, ?, 0)`,
          workoutId,
          re.exerciseId,
          i,
          re.targetReps,
          re.targetWeight ?? 0,
        );
      }
    }
  }
  return workoutId;
}

export async function finishWorkout(
  workoutId: number,
  notes?: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE workouts SET ended_at = datetime('now'), notes = ? WHERE id = ?",
    notes ?? null,
    workoutId,
  );
}

export async function deleteWorkout(workoutId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM workouts WHERE id = ?', workoutId);
}

type WorkoutSetRow = {
  id: number;
  workout_id: number;
  exercise_id: number;
  set_number: number;
  reps: number;
  weight: number;
  completed: number;
  ex_name: string;
  ex_muscle_group: MuscleGroup;
};

export async function getWorkoutSets(workoutId: number): Promise<WorkoutSet[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<WorkoutSetRow>(
    `SELECT ws.*, e.name AS ex_name, e.muscle_group AS ex_muscle_group
     FROM workout_sets ws
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE ws.workout_id = ?
     ORDER BY ws.exercise_id, ws.set_number`,
    workoutId,
  );
  return rows.map((r) => ({
    id: r.id,
    workoutId: r.workout_id,
    exerciseId: r.exercise_id,
    setNumber: r.set_number,
    reps: r.reps,
    weight: r.weight,
    completed: r.completed === 1,
    exercise: {
      id: r.exercise_id,
      name: r.ex_name,
      muscleGroup: r.ex_muscle_group,
    },
  }));
}

export async function updateWorkoutSet(
  setId: number,
  reps: number,
  weight: number,
  completed: boolean,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE workout_sets SET reps = ?, weight = ?, completed = ? WHERE id = ?',
    reps,
    weight,
    completed ? 1 : 0,
    setId,
  );
}

export async function addWorkoutSet(
  workoutId: number,
  exerciseId: number,
  reps: number,
  weight: number,
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(set_number), 0) + 1 AS next FROM workout_sets WHERE workout_id = ? AND exercise_id = ?',
    workoutId,
    exerciseId,
  );
  const setNumber = row?.next ?? 1;
  const res = await db.runAsync(
    `INSERT INTO workout_sets
     (workout_id, exercise_id, set_number, reps, weight, completed)
     VALUES (?, ?, ?, ?, ?, 1)`,
    workoutId,
    exerciseId,
    setNumber,
    reps,
    weight,
  );
  return res.lastInsertRowId;
}

type WorkoutRow = {
  id: number;
  routine_id: number | null;
  routine_name: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
};

export async function listWorkouts(): Promise<Workout[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<WorkoutRow>(
    `SELECT w.*, r.name AS routine_name
     FROM workouts w
     LEFT JOIN routines r ON r.id = w.routine_id
     ORDER BY w.started_at DESC`,
  );
  return rows.map((r) => ({
    id: r.id,
    routineId: r.routine_id ?? undefined,
    routineName: r.routine_name ?? undefined,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    notes: r.notes ?? undefined,
  }));
}

export async function getActiveWorkout(): Promise<Workout | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<WorkoutRow>(
    `SELECT w.*, r.name AS routine_name
     FROM workouts w
     LEFT JOIN routines r ON r.id = w.routine_id
     WHERE w.ended_at IS NULL
     ORDER BY w.started_at DESC LIMIT 1`,
  );
  if (!row) return null;
  return {
    id: row.id,
    routineId: row.routine_id ?? undefined,
    routineName: row.routine_name ?? undefined,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    notes: row.notes ?? undefined,
  };
}
