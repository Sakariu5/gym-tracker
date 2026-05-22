'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Hydrated } from '@/components/Hydrated';
import { StatCard } from '@/components/StatCard';
import { useStore } from '@/store/useStore';
import { sumMacros, todayISO } from '@/lib/calculations';
import type { MealType, NutritionEntry } from '@/types';

const MEALS: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snack'];

export default function NutritionPage() {
  return (
    <Hydrated>
      <Nutrition />
    </Hydrated>
  );
}

function Nutrition() {
  const nutrition = useStore((s) => s.nutrition);
  const favorites = useStore((s) => s.favorites);
  const goals = useStore((s) => s.profile.goals);
  const addNutrition = useStore((s) => s.addNutrition);
  const deleteNutrition = useStore((s) => s.deleteNutrition);
  const addFavorite = useStore((s) => s.addFavorite);
  const removeFavorite = useStore((s) => s.removeFavorite);

  const today = todayISO();
  const todayEntries = useMemo(
    () => nutrition.filter((n) => n.date.slice(0, 10) === today),
    [nutrition, today],
  );

  const macros = useMemo(() => sumMacros(todayEntries), [todayEntries]);

  const recent = useMemo(() => {
    const seen = new Set<string>();
    const out: NutritionEntry[] = [];
    for (const n of [...nutrition].reverse()) {
      const k = n.foodName.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
      if (out.length >= 8) break;
    }
    return out;
  }, [nutrition]);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<NutritionEntry, 'id' | 'createdAt'>>({
    date: today,
    foodName: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    mealType: 'snack',
  });
  const [favOnSubmit, setFavOnSubmit] = useState(false);

  const onSubmit = () => {
    if (!draft.foodName.trim()) return;
    addNutrition({ ...draft, date: today });
    if (favOnSubmit) {
      addFavorite({
        foodName: draft.foodName,
        calories: draft.calories,
        protein: draft.protein,
        carbs: draft.carbs,
        fat: draft.fat,
      });
    }
    setDraft({
      date: today,
      foodName: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealType: draft.mealType,
    });
    setFavOnSubmit(false);
    setOpen(false);
  };

  const quickAdd = (
    name: string,
    cals: number,
    p: number,
    c: number,
    f: number,
  ) => {
    addNutrition({
      date: today,
      foodName: name,
      calories: cals,
      protein: p,
      carbs: c,
      fat: f,
      mealType: 'snack',
    });
  };

  const calsTarget = goals.caloriesDaily;
  const proteinTarget = goals.proteinDaily;

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Comida</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Calorías"
          value={Math.round(macros.calories)}
          hint={calsTarget ? `de ${calsTarget}` : undefined}
        />
        <StatCard
          label="Proteína"
          value={`${Math.round(macros.protein)} g`}
          hint={proteinTarget ? `de ${proteinTarget} g` : undefined}
        />
        <StatCard label="Carbs" value={`${Math.round(macros.carbs)} g`} />
        <StatCard label="Grasa" value={`${Math.round(macros.fat)} g`} />
      </div>

      <Button onClick={() => setOpen(true)}>+ Añadir comida</Button>

      {favorites.length > 0 && (
        <div>
          <h2 className="text-sm uppercase text-muted mb-2">Favoritos</h2>
          <div className="flex flex-wrap gap-2">
            {favorites.map((f) => (
              <button
                key={f.id}
                onClick={() =>
                  quickAdd(f.foodName, f.calories, f.protein, f.carbs, f.fat)
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (confirm(`Quitar "${f.foodName}" de favoritos?`)) {
                    removeFavorite(f.id);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-surface border border-border text-sm active:bg-surfaceAlt"
              >
                <div className="font-medium">{f.foodName}</div>
                <div className="text-xs text-muted">
                  {f.calories} kcal · {f.protein}p
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <h2 className="text-sm uppercase text-muted mb-2">Recientes</h2>
          <div className="space-y-2">
            {recent.map((r) => (
              <button
                key={r.id}
                onClick={() =>
                  quickAdd(r.foodName, r.calories, r.protein, r.carbs, r.fat)
                }
                className="w-full text-left"
              >
                <Card padded={false} className="px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{r.foodName}</div>
                      <div className="text-xs text-muted">
                        {r.calories} kcal · {r.protein}p · {r.carbs}c · {r.fat}f
                      </div>
                    </div>
                    <span className="text-accent">+</span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {todayEntries.length > 0 && (
        <div>
          <h2 className="text-sm uppercase text-muted mb-2">Hoy</h2>
          <div className="space-y-2">
            {todayEntries.map((n) => (
              <Card key={n.id} padded={false} className="px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{n.foodName}</div>
                    <div className="text-xs text-muted">
                      {n.mealType} · {n.calories} kcal · {n.protein}p
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNutrition(n.id)}
                    className="text-red-400 text-xl px-2"
                  >
                    ×
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border-t border-border rounded-t-3xl w-full max-w-md mx-auto p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Añadir</h3>
              <button onClick={() => setOpen(false)} className="text-muted text-2xl">
                ×
              </button>
            </div>
            <Input
              label="Comida"
              placeholder="Ej. 4 huevos"
              value={draft.foodName}
              onChange={(e) => setDraft({ ...draft, foodName: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Calorías"
                type="number"
                inputMode="numeric"
                value={draft.calories || ''}
                onChange={(e) =>
                  setDraft({ ...draft, calories: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Proteína (g)"
                type="number"
                inputMode="numeric"
                value={draft.protein || ''}
                onChange={(e) =>
                  setDraft({ ...draft, protein: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Carbs (g)"
                type="number"
                inputMode="numeric"
                value={draft.carbs || ''}
                onChange={(e) =>
                  setDraft({ ...draft, carbs: parseFloat(e.target.value) || 0 })
                }
              />
              <Input
                label="Grasa (g)"
                type="number"
                inputMode="numeric"
                value={draft.fat || ''}
                onChange={(e) =>
                  setDraft({ ...draft, fat: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <div className="text-sm text-muted mb-1.5">Comida</div>
              <div className="flex gap-1.5">
                {MEALS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setDraft({ ...draft, mealType: m })}
                    className={`flex-1 py-2 rounded-lg text-sm capitalize ${
                      draft.mealType === m
                        ? 'bg-white text-black font-semibold'
                        : 'bg-surfaceAlt border border-borderAlt text-muted'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={favOnSubmit}
                onChange={(e) => setFavOnSubmit(e.target.checked)}
              />
              Guardar como favorito
            </label>
            <Button onClick={onSubmit}>Guardar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
