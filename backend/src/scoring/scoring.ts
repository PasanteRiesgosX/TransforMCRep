export type ScoreRank = 'EXPLORADOR' | 'USUARIO' | 'IMPULSOR' | 'EMBAJADOR';

export function resolveRank(score: number): ScoreRank {
  if (score <= 25) return 'EXPLORADOR';
  if (score <= 50) return 'USUARIO';
  if (score <= 75) return 'IMPULSOR';
  return 'EMBAJADOR';
}

export function calculateWeightedScore(weightedValue: number, totalWeight: number): number | null {
  if (totalWeight <= 0) return null;
  return Number(((weightedValue / totalWeight) * 100).toFixed(2));
}
