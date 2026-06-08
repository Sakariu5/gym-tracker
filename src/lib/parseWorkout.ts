import type { MuscleGroup, WeightUnit } from '@/types';

/**
 * Parser de entrenamientos en texto plano.
 *
 * Formato esperado (puedes pegar tus notas tal cual):
 *
 *   Pierna — 8 Jun 2026
 *
 *   Sentadilla Smith
 *   * 20 kg/lado × 15
 *   * 30 kg/lado × 10
 *   * Dropset:
 *       * 35 kg/lado × 4
 *       * 30 kg/lado × 5
 *
 *   Prensa 45°
 *   * 80 kg/lado × 12
 *
 *   Resumen
 *   * Cuádriceps: 10/10
 *
 * Reglas:
 *  - La primera línea es el título. Si tiene "Nombre — fecha" se separa la fecha.
 *  - Una línea con "<peso> [kg|lb][/lado] × <reps>" es un set.
 *  - "Dropset:" agrupa los sets que le siguen dentro del mismo ejercicio.
 *  - Cualquier otra línea suelta es el nombre de un ejercicio nuevo.
 *  - Desde "Resumen" en adelante todo se guarda como notas.
 */

export interface ParsedSet {
  weight: number;
  reps: number;
  unit: WeightUnit;
  perSide: boolean;
  dropGroup?: number;
}

export interface ParsedExercise {
  name: string;
  muscleGroup: MuscleGroup;
  sets: ParsedSet[];
}

export interface ParsedWorkout {
  name: string;
  date: string; // ISO datetime
  exercises: ParsedExercise[];
  notes?: string;
  totalSets: number;
}

export interface ParseError {
  error: string;
}

export type ParseResult = ParsedWorkout | ParseError;

export function isParseError(r: ParseResult): r is ParseError {
  return (r as ParseError).error !== undefined;
}

const MONTHS: Record<string, number> = {
  ene: 0, enero: 0,
  feb: 1, febrero: 1,
  mar: 2, marzo: 2,
  abr: 3, abril: 3,
  may: 4, mayo: 4,
  jun: 5, junio: 5,
  jul: 6, julio: 6,
  ago: 7, agosto: 7,
  sep: 8, sept: 8, set: 8, septiembre: 8,
  oct: 9, octubre: 9,
  nov: 10, noviembre: 10,
  dic: 11, diciembre: 11,
};

const MUSCLE_KEYWORDS: Array<[RegExp, MuscleGroup]> = [
  [/sentadilla|prensa|extensi|cuadr|zancada|hack|femoral|peso muerto|rumano|gluteo|glúteo|hip thrust|pantorrilla|gemelo|pierna/i, 'piernas'],
  [/banca|pecho|apertura|press inclinado|fondos|pec /i, 'pecho'],
  [/jal|dominada|remo|espalda|pull|dorsal|encogimiento/i, 'espalda'],
  [/hombro|press militar|lateral|posterior|arnold|face pull/i, 'hombros'],
  [/biceps|bíceps|curl b|curl con|martillo|predicador/i, 'biceps'],
  [/triceps|tríceps|frances|francés|polea triceps|copa|patada/i, 'triceps'],
  [/abdom|core|plancha|crunch|oblicuo|rueda/i, 'core'],
  [/cardio|carrera|remo erg|bici|cinta|eliptic/i, 'cardio'],
];

export function inferMuscleGroup(name: string, fallback: MuscleGroup): MuscleGroup {
  for (const [re, group] of MUSCLE_KEYWORDS) {
    if (re.test(name)) return group;
  }
  return fallback;
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Quita viñetas (*, -, •) y espacios al inicio. */
function stripBullet(line: string): string {
  return line.replace(/^[\s*\-•·]+/, '').trim();
}

/** Detecta y parsea una línea de set: "20 kg/lado × 15", "100 lb x 8", "60 × 12". */
function parseSetLine(line: string): Omit<ParsedSet, 'dropGroup'> | null {
  const clean = stripBullet(line);
  // peso  [unidad]  [/lado]  (x|×|por)  reps
  const m = clean.match(
    /^(\d+(?:[.,]\d+)?)\s*(kg|kgs|lb|lbs|kilos?|libras?)?\s*(\/?\s*(?:lado|side|c\/u))?\s*(?:x|×|por)\s*(\d+)/i,
  );
  if (!m) return null;
  const weight = parseFloat(m[1].replace(',', '.'));
  const reps = parseInt(m[4], 10);
  if (!Number.isFinite(weight) || !Number.isFinite(reps)) return null;
  const unitRaw = (m[2] ?? '').toLowerCase();
  const unit: WeightUnit = /lb|libra/.test(unitRaw) ? 'lb' : 'kg';
  const perSide = !!m[3] || /\/\s*lado|por lado/i.test(clean);
  return { weight, reps, unit, perSide };
}

function isDropsetHeader(line: string): boolean {
  return /^(drop\s?set|dropset)\b/i.test(stripBullet(line));
}

function isSummaryHeader(line: string): boolean {
  return /^(resumen|summary|notas?)\b/i.test(stripBullet(line));
}

/** Parsea "8 Jun 2026", "08/06/2026", "2026-06-08". Devuelve ISO o null. */
function parseDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  // ISO yyyy-mm-dd
  let m = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return buildISO(+m[1], +m[2] - 1, +m[3]);

  // dd/mm/yyyy o dd-mm-yyyy
  m = text.match(/(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})/);
  if (m) {
    const year = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return buildISO(year, +m[2] - 1, +m[1]);
  }

  // "8 Jun 2026" / "8 de junio de 2026"
  m = text.match(/(\d{1,2})\s*(?:de\s+)?([a-záéíóú]+)\.?\s*(?:de\s+)?(\d{4})?/i);
  if (m) {
    const monthKey = m[2]
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .slice(0, 4);
    let month = MONTHS[monthKey];
    if (month === undefined) month = MONTHS[monthKey.slice(0, 3)];
    if (month !== undefined) {
      const year = m[3] ? +m[3] : new Date().getFullYear();
      return buildISO(year, month, +m[1]);
    }
  }
  return null;
}

function buildISO(year: number, month: number, day: number): string {
  const d = new Date(year, month, day, 12, 0, 0);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

export function parseWorkoutText(input: string): ParseResult {
  const rawLines = input.replace(/\r\n/g, '\n').split('\n');
  const lines = rawLines.map((l) => l.trimEnd());

  // Primera línea no vacía = título (+ fecha opcional).
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length) return { error: 'No hay contenido para registrar.' };

  const titleLine = stripBullet(lines[i]);
  i++;

  let name = titleLine;
  let date = new Date().toISOString();
  const sep = titleLine.split(/\s+[—–-]\s+/);
  if (sep.length >= 2) {
    const maybeDate = parseDate(sep.slice(1).join(' - '));
    if (maybeDate) {
      name = sep[0].trim();
      date = maybeDate;
    }
  } else {
    const maybeDate = parseDate(titleLine);
    if (maybeDate && /\d{4}|\d{1,2}[/.]\d{1,2}/.test(titleLine)) {
      // El título es solo una fecha.
      date = maybeDate;
    }
  }

  const exercises: ParsedExercise[] = [];
  const notesLines: string[] = [];
  let current: ParsedExercise | null = null;
  let inDropset = false;
  let dropCounter = 0;
  let inSummary = false;
  const fallbackGroup = inferMuscleGroup(name, 'otro');

  for (; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') continue;

    if (inSummary) {
      notesLines.push(stripBullet(line));
      continue;
    }

    if (isSummaryHeader(line)) {
      inSummary = true;
      inDropset = false;
      continue;
    }

    if (isDropsetHeader(line)) {
      if (current) {
        inDropset = true;
        dropCounter++;
      }
      continue;
    }

    const parsedSet = parseSetLine(line);
    if (parsedSet) {
      if (!current) {
        // Set sin ejercicio: crea uno genérico.
        current = { name: 'Ejercicio', muscleGroup: fallbackGroup, sets: [] };
        exercises.push(current);
      }
      current.sets.push({
        ...parsedSet,
        dropGroup: inDropset ? dropCounter : undefined,
      });
      continue;
    }

    // Línea suelta → nuevo ejercicio.
    const exName = stripBullet(line);
    if (!exName) continue;
    current = {
      name: exName,
      muscleGroup: inferMuscleGroup(exName, fallbackGroup),
      sets: [],
    };
    inDropset = false;
    exercises.push(current);
  }

  const withSets = exercises.filter((e) => e.sets.length > 0);
  if (withSets.length === 0) {
    return {
      error:
        'No se reconoció ningún set. Usa el formato "<peso> kg × <reps>" en cada serie.',
    };
  }

  const totalSets = withSets.reduce((acc, e) => acc + e.sets.length, 0);
  const notes = notesLines.join('\n').trim();

  return {
    name: name || 'Sesión',
    date,
    exercises: withSets,
    notes: notes || undefined,
    totalSets,
  };
}
