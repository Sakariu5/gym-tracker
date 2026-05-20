import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { colors, spacing } from '@/theme/colors';
import { listWorkouts } from '@/database/db';
import type { Workout } from '@/types';
import type { RootStackParamList } from '@/navigation/AppNavigator';
import { formatDate, formatDuration, formatTime } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const load = useCallback(async () => {
    setWorkouts(await listWorkouts());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <Text style={styles.title}>Historial</Text>
      <FlatList
        data={workouts}
        keyExtractor={(w) => String(w.id)}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Sin entrenamientos todavía. Empieza uno desde Inicio.
          </Text>
        }
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate('WorkoutDetail', { workoutId: item.id })
            }
          >
            <Text style={styles.name}>
              {item.routineName ?? 'Sesión libre'}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{formatDate(item.startedAt)}</Text>
              <Text style={styles.meta}>{formatTime(item.startedAt)}</Text>
              <Text style={styles.meta}>
                {formatDuration(item.startedAt, item.endedAt)}
              </Text>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginVertical: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
