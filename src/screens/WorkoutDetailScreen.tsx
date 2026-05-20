import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  useFocusEffect,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, spacing } from '@/theme/colors';
import { getWorkoutSets, listWorkouts } from '@/database/db';
import type { Workout, WorkoutSet } from '@/types';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { formatDate, formatDuration, formatTime } from '@/utils/format';

type R = RouteProp<RootStackParamList, 'WorkoutDetail'>;

export function WorkoutDetailScreen() {
  const { params } = useRoute<R>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);

  const load = useCallback(async () => {
    const all = await listWorkouts();
    setWorkout(all.find((w) => w.id === params.workoutId) ?? null);
    setSets(await getWorkoutSets(params.workoutId));
  }, [params.workoutId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const groups = useMemo(() => {
    const map = new Map<
      number,
      { name: string; muscle: string; sets: WorkoutSet[] }
    >();
    for (const s of sets) {
      if (!map.has(s.exerciseId)) {
        map.set(s.exerciseId, {
          name: s.exercise?.name ?? 'Ejercicio',
          muscle: s.exercise?.muscleGroup ?? '',
          sets: [],
        });
      }
      map.get(s.exerciseId)!.sets.push(s);
    }
    return Array.from(map.values());
  }, [sets]);

  const totalVolume = useMemo(
    () =>
      sets
        .filter((s) => s.completed)
        .reduce((acc, s) => acc + s.reps * s.weight, 0),
    [sets],
  );
  const completedSets = sets.filter((s) => s.completed).length;

  if (!workout) {
    return (
      <Screen>
        <Text style={styles.muted}>Cargando…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text style={styles.title}>
          {workout.routineName ?? 'Sesión libre'}
        </Text>
        <Text style={styles.meta}>
          {formatDate(workout.startedAt)} · {formatTime(workout.startedAt)} ·{' '}
          {formatDuration(workout.startedAt, workout.endedAt)}
        </Text>

        <View style={styles.statsRow}>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>{completedSets}</Text>
            <Text style={styles.statLabel}>Series</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>{Math.round(totalVolume)}</Text>
            <Text style={styles.statLabel}>Volumen (kg·reps)</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>{groups.length}</Text>
            <Text style={styles.statLabel}>Ejercicios</Text>
          </Card>
        </View>

        {groups.map((g, i) => (
          <Card key={i} style={styles.exCard}>
            <Text style={styles.exName}>{g.name}</Text>
            <Text style={styles.exMuscle}>{g.muscle}</Text>
            {g.sets.map((s) => (
              <Text
                key={s.id}
                style={[styles.setLine, !s.completed && styles.skipped]}
              >
                Serie {s.setNumber}: {s.reps} reps × {s.weight} kg
                {s.completed ? ' ✓' : '  (no completada)'}
              </Text>
            ))}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  meta: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  exCard: {
    marginBottom: spacing.md,
  },
  exName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  exMuscle: {
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  setLine: {
    color: colors.text,
    paddingVertical: 4,
  },
  skipped: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  muted: {
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
