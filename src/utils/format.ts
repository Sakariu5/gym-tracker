export function formatDate(iso: string): string {
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso.replace(' ', 'T') + 'Z');
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(startIso: string, endIso?: string): string {
  if (!endIso) return 'en curso';
  const start = new Date(startIso.replace(' ', 'T') + 'Z').getTime();
  const end = new Date(endIso.replace(' ', 'T') + 'Z').getTime();
  const mins = Math.round((end - start) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
