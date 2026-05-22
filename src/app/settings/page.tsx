'use client';

import Link from 'next/link';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Hydrated } from '@/components/Hydrated';
import { useStore } from '@/store/useStore';

export default function SettingsPage() {
  return (
    <Hydrated>
      <Settings />
    </Hydrated>
  );
}

function Settings() {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const setGoal = useStore((s) => s.setGoal);
  const reset = useStore((s) => s.reset);

  const numOrUndef = (v: string) => {
    if (!v.trim()) return undefined;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return (
    <div className="py-6 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>

      <Card>
        <h2 className="font-semibold mb-3">Perfil</h2>
        <div className="space-y-3">
          <Input
            label="Nombre"
            value={profile.name ?? ''}
            onChange={(e) => setProfile({ name: e.target.value })}
          />
          <Input
            label="Altura (cm)"
            type="number"
            inputMode="decimal"
            value={profile.height ?? ''}
            onChange={(e) =>
              setProfile({ height: numOrUndef(e.target.value) })
            }
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Metas</h2>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Peso objetivo (kg)"
            type="number"
            inputMode="decimal"
            value={profile.goals.weight ?? ''}
            onChange={(e) => setGoal('weight', numOrUndef(e.target.value))}
          />
          <Input
            label="Grasa objetivo (%)"
            type="number"
            inputMode="decimal"
            value={profile.goals.bodyFat ?? ''}
            onChange={(e) => setGoal('bodyFat', numOrUndef(e.target.value))}
          />
          <Input
            label="Calorías/día"
            type="number"
            inputMode="numeric"
            value={profile.goals.caloriesDaily ?? ''}
            onChange={(e) =>
              setGoal('caloriesDaily', numOrUndef(e.target.value))
            }
          />
          <Input
            label="Proteína/día (g)"
            type="number"
            inputMode="numeric"
            value={profile.goals.proteinDaily ?? ''}
            onChange={(e) =>
              setGoal('proteinDaily', numOrUndef(e.target.value))
            }
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">Sobre</h2>
        <p className="text-sm text-muted mt-1">
          Datos guardados localmente en este navegador. Para sincronizar entre
          dispositivos, conectaremos Supabase próximamente.
        </p>
        <div className="mt-4">
          <Button
            variant="danger"
            onClick={() => {
              if (
                confirm(
                  'Borrar TODOS los datos (workouts, peso, comida, metas)?',
                )
              ) {
                reset();
              }
            }}
          >
            Borrar todos los datos
          </Button>
        </div>
      </Card>

      <div className="text-center">
        <Link href="/" className="text-sm text-muted">
          ← Volver
        </Link>
      </div>
    </div>
  );
}
