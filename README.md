# Gym Tracker

PWA enfocada en logging rápido de entrenamiento, comida y composición corporal.
Web app instalable en iOS/Android — no app store, no compilación nativa.

> Sistema operativo personal de progreso físico.

## Stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** (tema dark fijo)
- **Zustand** con `persist` middleware → datos en `localStorage`
- **Recharts** para gráficas
- **PWA** vía `manifest.json` (instalable en iOS desde Safari → Compartir → Añadir a inicio)
- **Supabase** (preparado, no conectado en V1)

## Filosofía

Las apps que dominan (Strong, Hevy, MacroFactor, Fitbod) tienen demasiada fricción.
Esta app contesta inmediatamente:

- ¿Estoy progresando?
- ¿Subí fuerza?
- ¿Estoy cumpliendo calorías?
- ¿Estoy acercándome a la meta?

Nada más. Cero red social, cero coach AI, cero gamificación.

## Pantallas

| Ruta          | Descripción                                                       |
| ------------- | ----------------------------------------------------------------- |
| `/`           | Dashboard "Hoy": peso, calorías, proteína, racha, último workout |
| `/workout`    | Lista + empezar sesión + chips para repetir nombres anteriores   |
| `/workout/[id]` | Sesión activa con sets editables, autocomplete, 1RM estimado    |
| `/nutrition`  | Quick-add desde recientes/favoritos, totales del día             |
| `/body`       | Peso, grasa, músculo, cintura + gráfica con media móvil 7d       |
| `/progress`   | 1RM por ejercicio, peso 7d MA, adherencia calórica               |
| `/settings`   | Perfil, metas (peso, grasa, kcal, proteína), reset                |

## UX crítica del workout

- Autocomplete: cada set nuevo copia peso/reps del set anterior
- **"Repetir"**: clona los sets del último día que hiciste ese ejercicio
- Tap en ✓ → set completado, color verde, **guardado instantáneo** en localStorage
- 1RM estimado visible en cada bloque (fórmula Epley: `w · (1 + r/30)`)
- Sin botón "Guardar workout": cada cambio persiste solo

## Cómo correrlo

Desde la raíz del repo:

```bash
bash dev.sh
```

(Eso hace `npm install` si hace falta y arranca `next dev` en el puerto 3000.)

En Codespaces: abre la pestaña **Ports** y toca el ícono de globo 🌐 del puerto **3000**.
La URL pública se abre en Safari. Para instalarla como app en iOS:
**Compartir → Añadir a inicio**.

## Roadmap

### V1 (hecho — esta entrega)

- [x] Logging de workouts con sets/reps/peso, autocomplete, 1RM estimado
- [x] Body metrics con gráfica de peso + media móvil 7d
- [x] Comida con quick-add desde favoritos y recientes
- [x] Dashboard "Hoy" con stats clave
- [x] Página de progreso con 1RM por ejercicio y adherencia calórica
- [x] Metas configurables
- [x] Persistencia local (sin backend)
- [x] PWA instalable

### V2 (próximo)

- [ ] Supabase: auth + sync (multi-device)
- [ ] Templates de rutinas guardadas
- [ ] Timer de descanso entre sets
- [ ] Búsqueda de comida (OpenFoodFacts API)
- [ ] Fotos de progreso (Supabase Storage)

### V3

- [ ] AI insights ("tu bench subió 5kg en 4 semanas")
- [ ] Recomendación adaptiva de calorías (estilo MacroFactor)
- [ ] Export CSV/JSON

## Estructura

```
fitness-app/
├── src/
│   ├── app/                  # App Router (server por defecto, "use client" donde toca)
│   │   ├── page.tsx          # Dashboard
│   │   ├── workout/
│   │   ├── nutrition/
│   │   ├── body/
│   │   ├── progress/
│   │   └── settings/
│   ├── components/           # UI primitivos: Card, Button, Input, StatCard, BottomNav, Hydrated
│   ├── lib/
│   │   ├── calculations.ts   # 1RM, media móvil, sumas, series
│   │   ├── format.ts         # fechas, uid
│   │   └── seed.ts           # ~20 ejercicios precargados
│   ├── store/useStore.ts     # Zustand + persist (localStorage)
│   └── types/index.ts        # Modelos de dominio
├── public/                   # manifest.json, icon.svg
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## Datos

Todo vive en `localStorage` bajo la clave `gymtracker:v1`. Para resetear:
**Ajustes → Borrar todos los datos**. Cuando conectemos Supabase, este store se
exporta y se sincroniza.

## Comprobado

- `npm run typecheck` → limpio
- `npm run build` → 9 rutas estáticas + 1 dinámica, ~210 kB First Load JS (peor caso, con Recharts)
- Todas las rutas responden 200 en `next dev`
