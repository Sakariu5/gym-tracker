import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '@/theme/colors';
import { HomeScreen } from '@/screens/HomeScreen';
import { RoutinesScreen } from '@/screens/RoutinesScreen';
import { RoutineDetailScreen } from '@/screens/RoutineDetailScreen';
import { AddExerciseToRoutineScreen } from '@/screens/AddExerciseToRoutineScreen';
import { WorkoutScreen } from '@/screens/WorkoutScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { WorkoutDetailScreen } from '@/screens/WorkoutDetailScreen';

export type RootStackParamList = {
  Tabs: undefined;
  RoutineDetail: { routineId: number };
  AddExerciseToRoutine: { routineId: number };
  Workout: { workoutId: number };
  WorkoutDetail: { workoutId: number };
};

export type TabsParamList = {
  Home: undefined;
  Routines: undefined;
  History: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{label}</Text>
  );
}

function TabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon label="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{
          title: 'Rutinas',
          tabBarIcon: ({ focused }) => <TabIcon label="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => <TabIcon label="📈" focused={focused} />,
        }}
      />
    </Tabs.Navigator>
  );
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="Tabs"
          component={TabsNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoutineDetail"
          component={RoutineDetailScreen}
          options={{ title: 'Detalle de rutina' }}
        />
        <Stack.Screen
          name="AddExerciseToRoutine"
          component={AddExerciseToRoutineScreen}
          options={{ title: 'Añadir ejercicio' }}
        />
        <Stack.Screen
          name="Workout"
          component={WorkoutScreen}
          options={{ title: 'Entrenamiento', headerBackVisible: false }}
        />
        <Stack.Screen
          name="WorkoutDetail"
          component={WorkoutDetailScreen}
          options={{ title: 'Entrenamiento' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
