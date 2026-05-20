# GymTracker

App móvil personal para registrar rutinas y progreso del gimnasio. Construida con **React Native + Expo** y **SQLite local** (sin backend).

## Stack

- **Expo SDK 51** + React Native 0.74
- **TypeScript** estricto
- **expo-sqlite** para persistencia local
- **React Navigation** (stack + bottom tabs)

## Estructura

```
fitness-app/
├── App.tsx                      # Entry point + bootstrap de la DB
├── app.json                     # Configuración Expo (iOS/Android)
├── package.json
├── tsconfig.json
└── src/
    ├── components/              # Botón, Card, Screen
    ├── database/db.ts           # Schema SQLite + queries tipadas
    ├── navigation/              # Stack + Tabs
    ├── screens/
    │   ├── HomeScreen           # Dashboard, sesión activa, rutinas recientes
    │   ├── RoutinesScreen       # CRUD de rutinas
    │   ├── RoutineDetailScreen  # Ejercicios de una rutina
    │   ├── AddExerciseToRoutineScreen
    │   ├── WorkoutScreen        # Sesión en curso (series/reps/peso/check)
    │   ├── HistoryScreen        # Historial de entrenamientos
    │   └── WorkoutDetailScreen  # Resumen + stats por sesión
    ├── theme/colors.ts          # Paleta dark + spacing + radii
    ├── types/index.ts           # Modelos de dominio
    └── utils/format.ts          # Helpers de fecha/duración
```

## Modelo de datos

- `exercises` — biblioteca de ejercicios (se siembra con ~18 ejercicios comunes)
- `routines` — rutinas guardadas
- `routine_exercises` — ejercicios de cada rutina con series/reps/peso objetivo
- `workouts` — sesiones (con `started_at` / `ended_at`)
- `workout_sets` — series individuales registradas

## Cómo correrlo

```bash
cd fitness-app
npm install
npx expo start
```

Luego:
- Escanea el QR con **Expo Go** (iOS/Android) para probar en tu teléfono
- O presiona `i` para iOS Simulator / `a` para Android Emulator

## Flujo MVP

1. **Inicio** → ves rutinas y últimas sesiones; puedes empezar una sesión libre o desde rutina.
2. **Rutinas** → crea una rutina (ej. "Push day"), entra al detalle y añade ejercicios con series/reps/peso objetivo.
3. **Entrenamiento** → cuando inicias desde una rutina, las series ya están precargadas. Editas reps/peso y marcas el check al terminar cada serie. Puedes añadir series o ejercicios extra sobre la marcha.
4. **Historial** → cada sesión queda con duración, volumen total (kg·reps), nº de series y desglose por ejercicio.

## Roadmap (post-MVP)

- Gráficas de progreso por ejercicio (peso máximo, volumen semanal)
- Temporizador de descanso entre series
- Sincronización opcional en la nube (Supabase) para preparar venta con cuentas
- Plantillas de rutinas prediseñadas
- Exportar/importar datos (JSON, CSV)
- Notificaciones push para días de entreno

## Notas para monetización futura

- Los datos viven en `expo-sqlite` local. Para vender la app con suscripciones, lo natural es migrar a un esquema híbrido: SQLite local + Supabase/Firebase para sync.
- El bundle id ya está reservado: `com.adray.gymtracker` (ajustable en `app.json` antes de publicar).
- Diseño dark por defecto con paleta cyan; fácil de re-temar desde `src/theme/colors.ts`.
