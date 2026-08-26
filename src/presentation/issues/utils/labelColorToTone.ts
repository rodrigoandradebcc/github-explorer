import type { BadgeTone } from '@/design-system';

export function labelColorToTone(hex: string): BadgeTone {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  if (r > 180 && g < 100 && b < 100) return 'danger';
  if (g > 160 && r < 140) return 'success';
  if (r > 180 && g > 120 && b < 80) return 'warning';
  if (b > 160 && r < 140) return 'info';

  return 'default';
}
