import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, radius, spacing } from '@/theme/colors';
import { createRoutine, deleteRoutine, listRoutines } from '@/database/db';
import type { Routine } from '@/types';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RoutinesScreen() {
  const navigation = useNavigation<Nav>();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setRoutines(await listRoutines());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Pon un nombre a la rutina.');
      return;
    }
    await createRoutine(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    setModalOpen(false);
    await load();
  };

  const onDelete = (id: number, name: string) => {
    Alert.alert('Eliminar rutina', `¿Borrar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteRoutine(id);
          await load();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Rutinas</Text>
        <Button label="+ Nueva" onPress={() => setModalOpen(true)} />
      </View>

      <FlatList
        data={routines}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No tienes rutinas. Crea una para empezar.
          </Text>
        }
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate('RoutineDetail', { routineId: item.id })
            }
          >
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.desc}>{item.description}</Text>
                ) : null}
              </View>
              <Text
                style={styles.delete}
                onPress={() => onDelete(item.id, item.name)}
              >
                ✕
              </Text>
            </View>
          </Card>
        )}
      />

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva rutina</Text>
            <TextInput
              placeholder="Nombre (ej. Push day)"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              placeholder="Descripción (opcional)"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Cancelar"
                variant="ghost"
                onPress={() => setModalOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                label="Crear"
                onPress={onCreate}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  card: {
    marginBottom: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  desc: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  delete: {
    color: colors.danger,
    fontSize: 20,
    paddingHorizontal: spacing.sm,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
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
    fontSize: 16,
  },
});
