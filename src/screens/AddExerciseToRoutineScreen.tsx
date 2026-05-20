import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
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
import { addExerciseToRoutine, listExercises } from '@/database/db';
import type { Exercise } from '@/types';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'AddExerciseToRoutine'>;

export function AddExerciseToRoutineScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<R>();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');

  const load = useCallback(async () => {
    setExercises(await listExercises());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscleGroup.toLowerCase().includes(q),
    );
  }, [exercises, query]);

  const onConfirm = async () => {
    if (!selected) return;
    const s = parseInt(sets, 10);
    const r = parseInt(reps, 10);
    const w = weight.trim() ? parseFloat(weight) : undefined;
    if (!s || s < 1 || !r || r < 1) {
      Alert.alert('Valores inválidos', 'Series y repeticiones deben ser > 0.');
      return;
    }
    await addExerciseToRoutine(params.routineId, selected.id, s, r, w);
    navigation.goBack();
  };

  return (
    <Screen>
      <Text style={styles.title}>Elige un ejercicio</Text>
      <TextInput
        placeholder="Buscar…"
        placeholderTextColor={colors.textMuted}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />
      <FlatList
        data={filtered}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => setSelected(item)}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.muscle}>{item.muscleGroup}</Text>
          </Card>
        )}
      />

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selected?.name}</Text>
            <Text style={styles.muted}>Configura series objetivo</Text>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Series</Text>
                <TextInput
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Reps</Text>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Cancelar"
                variant="ghost"
                onPress={() => setSelected(null)}
                style={{ flex: 1 }}
              />
              <Button
                label="Añadir"
                onPress={onConfirm}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  search: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  muscle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  muted: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  field: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
});
