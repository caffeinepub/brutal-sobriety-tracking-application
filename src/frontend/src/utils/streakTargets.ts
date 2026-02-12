// Shared streak target options and utilities
export const STREAK_TARGET_OPTIONS = [
  '2 days',
  '5 days',
  '1 week',
  '2 weeks',
  '1 month',
] as const;

export type StreakTargetOption = typeof STREAK_TARGET_OPTIONS[number];

export function parseStreakTargetToDays(target: string): number {
  const normalized = target.toLowerCase().trim();
  
  if (normalized.includes('2 days')) return 2;
  if (normalized.includes('5 days')) return 5;
  if (normalized.includes('1 week')) return 7;
  if (normalized.includes('2 weeks')) return 14;
  if (normalized.includes('1 month')) return 30;
  
  // Fallback
  return 7;
}
