import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/theme/colors';
import {
  getActiveWorkout,
  listRoutines,
  listWorkouts,
  startWorkout,
} from '@/database/db';
import type { Routine, Workout } from '@/types';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { formatDate } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [active, setActive] = useState<Workout | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [lastWorkouts, setLastWorkouts] = useState<Workout[]>([]);

  const load = useCallback(async () => {
    const [a, r, w] = await Promise.all([
      getActiveWorkout(),
      listRoutines(),
      listWorkouts(),
    ]);
    setActive(a);
    setRoutines(r);
    setLastWorkouts(w.filter((x) => x.endedAt).slice(0, 3));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onQuickStart = async () => {
    const id = await startWorkout();
    navigation.navigate('Workout', { workoutId: id });
  };

  const onStartFromRoutine = async (routineId: number) => {
    const id = await startWorkout(routineId);
    navigation.navigate('Workout', { workoutId: id });
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>GymTracker</Text>
        <Text style={styles.subtitle}>Vamos a entrenar 💪</Text>

        {active ? (
          <Card style={styles.section}>
            <Text style={styles.cardTitle}>Entrenamiento en curso</Text>
            <Text style={styles.cardSub}>
              {active.routineName ?? 'Sesión libre'} ·{' '}
              {formatDate(active.startedAt)}
            </Text>
            <Button
              label="Continuar"
              onPress={() =>
                navigation.navigate('Workout', { workoutId: active.id })
              }
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : (
          <Card style={styles.section}>
            <Text style={styles.cardTitle}>Empezar entrenamiento</Text>
            <Text style={styles.cardSub}>
              Inicia una sesión libre o elige una de tus rutinas.
            </Text>
            <Button
              label="Sesión libre"
              onPress={onQuickStart}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        )}

        <Text style={styles.sectionTitle}>Tus rutinas</Text>
        {routines.length === 0 ? (
          <Text style={styles.muted}>
            Aún no tienes rutinas. Crea una desde la pestaña Rutinas.
          </Text>
        ) : (
          routines.slice(0, 3).map((r) => (
            <Card
              key={r.id}
              style={styles.routineCard}
              onPress={() => onStartFromRoutine(r.id)}
            >
              <Text style={styles.cardTitle}>{r.name}</Text>
              {r.description ? (
                <Text style={styles.cardSub}>{r.description}</Text>
              ) : null}
              <Text style={styles.cta}>Tocar para empezar →</Text>
            </Card>
          ))
        )}

        <Text style={styles.sectionTitle}>Últimos entrenamientos</Text>
        {lastWorkouts.length === 0 ? (
          <Text style={styles.muted}>Sin historial todavía.</Text>
        ) : (
          lastWorkouts.map((w) => (
            <Card
              key={w.id}
              style={styles.routineCard}
              onPress={() =>
                navigation.navigate('WorkoutDetail', { workoutId: w.id })
              }
            >
              <Text style={styles.cardTitle}>
                {w.routineName ?? 'Sesión libre'}
              </Text>
              <Text style={styles.cardSub}>{formatDate(w.startedAt)}</Text>
            </Card>
          ))
        )}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardSub: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  cta: {
    color: colors.primary,
    fontSize: 14,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
  },
  routineCard: {
    marginBottom: spacing.md,
  },
});
