import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/theme/colors';
import {
  getRoutine,
  removeRoutineExercise,
  startWorkout,
} from '@/database/db';
import type { Routine } from '@/types';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'RoutineDetail'>;

export function RoutineDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [routine, setRoutine] = useState<Routine | null>(null);

  const load = useCallback(async () => {
    setRoutine(await getRoutine(params.routineId));
  }, [params.routineId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onStart = async () => {
    const id = await startWorkout(params.routineId);
    navigation.navigate('Workout', { workoutId: id });
  };

  const onRemove = (id: number, name: string) => {
    Alert.alert('Quitar ejercicio', `¿Quitar "${name}" de la rutina?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          await removeRoutineExercise(id);
          await load();
        },
      },
    ]);
  };

  if (!routine) {
    return (
      <Screen>
        <Text style={styles.muted}>Cargando…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text style={styles.title}>{routine.name}</Text>
        {routine.description ? (
          <Text style={styles.desc}>{routine.description}</Text>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Empezar entrenamiento"
            onPress={onStart}
            style={{ flex: 1 }}
          />
        </View>

        <Text style={styles.sectionTitle}>Ejercicios</Text>
        {(routine.exercises ?? []).length === 0 ? (
          <Text style={styles.muted}>
            Aún no hay ejercicios. Añade el primero.
          </Text>
        ) : (
          routine.exercises!.map((re) => (
            <Card key={re.id} style={styles.exerciseCard}>
              <View style={styles.exerciseRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>
                    {re.exercise?.name}
                  </Text>
                  <Text style={styles.exerciseMeta}>
                    {re.exercise?.muscleGroup} · {re.targetSets} ×{' '}
                    {re.targetReps}
                    {re.targetWeight ? ` @ ${re.targetWeight} kg` : ''}
                  </Text>
                </View>
                <Text
                  style={styles.delete}
                  onPress={() => onRemove(re.id, re.exercise?.name ?? '')}
                >
                  ✕
                </Text>
              </View>
            </Card>
          ))
        )}

        <Button
          label="+ Añadir ejercicio"
          variant="secondary"
          onPress={() =>
            navigation.navigate('AddExerciseToRoutine', {
              routineId: routine.id,
            })
          }
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  desc: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  exerciseCard: {
    marginBottom: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  delete: {
    color: colors.danger,
    fontSize: 20,
    paddingHorizontal: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.lg,
  },
});
