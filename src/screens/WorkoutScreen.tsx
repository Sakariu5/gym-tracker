import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import { colors, radius, spacing } from '@/theme/colors';
import {
  addWorkoutSet,
  deleteWorkout,
  finishWorkout,
  getWorkoutSets,
  listExercises,
  updateWorkoutSet,
} from '@/database/db';
import type { Exercise, WorkoutSet } from '@/types';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'Workout'>;

interface SetGroup {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  sets: WorkoutSet[];
}

function groupSets(sets: WorkoutSet[]): SetGroup[] {
  const map = new Map<number, SetGroup>();
  for (const s of sets) {
    const key = s.exerciseId;
    if (!map.has(key)) {
      map.set(key, {
        exerciseId: key,
        exerciseName: s.exercise?.name ?? 'Ejercicio',
        muscleGroup: s.exercise?.muscleGroup ?? '',
        sets: [],
      });
    }
    map.get(key)!.sets.push(s);
  }
  return Array.from(map.values());
}

export function WorkoutScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setSets(await getWorkoutSets(params.workoutId));
  }, [params.workoutId]);

  useFocusEffect(
    useCallback(() => {
      load();
      listExercises().then(setExercises);
    }, [load]),
  );

  const groups = useMemo(() => groupSets(sets), [sets]);

  const filteredExercises = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.toLowerCase().includes(q),
    );
  }, [exercises, query]);

  const updateSet = async (
    set: WorkoutSet,
    patch: Partial<Pick<WorkoutSet, 'reps' | 'weight' | 'completed'>>,
  ) => {
    const next = { ...set, ...patch };
    setSets((prev) => prev.map((s) => (s.id === set.id ? next : s)));
    await updateWorkoutSet(next.id, next.reps, next.weight, next.completed);
  };

  const onAddExercise = async (ex: Exercise) => {
    await addWorkoutSet(params.workoutId, ex.id, 10, 0);
    setPickerOpen(false);
    setQuery('');
    await load();
  };

  const onFinish = () => {
    Alert.alert('Terminar entrenamiento', '¿Guardar y cerrar la sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Terminar',
        onPress: async () => {
          await finishWorkout(params.workoutId);
          navigation.navigate('Tabs');
        },
      },
    ]);
  };

  const onDiscard = () => {
    Alert.alert(
      'Descartar entrenamiento',
      'Se borrarán todas las series registradas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(params.workoutId);
            navigation.navigate('Tabs');
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text style={styles.title}>En progreso</Text>
        <Text style={styles.subtitle}>
          Marca las series que completes. Toca + para añadir más.
        </Text>

        {groups.length === 0 ? (
          <Text style={styles.empty}>
            Sin ejercicios todavía. Añade uno para empezar.
          </Text>
        ) : (
          groups.map((g) => (
            <Card key={g.exerciseId} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{g.exerciseName}</Text>
              <Text style={styles.muscle}>{g.muscleGroup}</Text>

              <View style={styles.headerRow}>
                <Text style={[styles.hCell, { flex: 0.5 }]}>#</Text>
                <Text style={styles.hCell}>Reps</Text>
                <Text style={styles.hCell}>Kg</Text>
                <Text style={[styles.hCell, { flex: 0.7 }]}>Hecho</Text>
              </View>

              {g.sets.map((s) => (
                <View key={s.id} style={styles.setRow}>
                  <Text style={[styles.cell, { flex: 0.5 }]}>
                    {s.setNumber}
                  </Text>
                  <TextInput
                    style={styles.cellInput}
                    keyboardType="number-pad"
                    value={String(s.reps)}
                    onChangeText={(v) =>
                      updateSet(s, { reps: parseInt(v, 10) || 0 })
                    }
                  />
                  <TextInput
                    style={styles.cellInput}
                    keyboardType="decimal-pad"
                    value={String(s.weight)}
                    onChangeText={(v) =>
                      updateSet(s, { weight: parseFloat(v) || 0 })
                    }
                  />
                  <Pressable
                    onPress={() => updateSet(s, { completed: !s.completed })}
                    style={[
                      styles.check,
                      s.completed && { backgroundColor: colors.success },
                    ]}
                  >
                    <Text style={styles.checkLabel}>
                      {s.completed ? '✓' : ''}
                    </Text>
                  </Pressable>
                </View>
              ))}

              <Button
                label="+ Serie"
                variant="ghost"
                onPress={async () => {
                  const last = g.sets[g.sets.length - 1];
                  await addWorkoutSet(
                    params.workoutId,
                    g.exerciseId,
                    last?.reps ?? 10,
                    last?.weight ?? 0,
                  );
                  await load();
                }}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          ))
        )}

        <Button
          label="+ Añadir ejercicio"
          variant="secondary"
          onPress={() => setPickerOpen(true)}
          style={{ marginTop: spacing.lg }}
        />

        <View style={styles.footerRow}>
          <Button
            label="Descartar"
            variant="danger"
            onPress={onDiscard}
            style={{ flex: 1 }}
          />
          <Button label="Terminar" onPress={onFinish} style={{ flex: 2 }} />
        </View>
      </ScrollView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Añadir ejercicio</Text>
            <TextInput
              placeholder="Buscar…"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />
            <ScrollView style={{ maxHeight: 400 }}>
              {filteredExercises.map((e) => (
                <Pressable
                  key={e.id}
                  style={styles.exItem}
                  onPress={() => onAddExercise(e)}
                >
                  <Text style={styles.exItemName}>{e.name}</Text>
                  <Text style={styles.muscle}>{e.muscleGroup}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              label="Cerrar"
              variant="ghost"
              onPress={() => setPickerOpen(false)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>
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
  subtitle: {
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  exerciseCard: {
    marginBottom: spacing.md,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  muscle: {
    color: colors.textMuted,
    fontSize: 13,
  },
  headerRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hCell: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  cell: {
    flex: 1,
    color: colors.text,
    textAlign: 'center',
  },
  cellInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  check: {
    flex: 0.7,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    color: '#001016',
    fontSize: 18,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exItemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
