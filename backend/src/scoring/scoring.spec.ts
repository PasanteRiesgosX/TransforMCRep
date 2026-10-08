import { calculateWeightedScore, resolveRank } from './scoring';

describe('shared score calculations', () => {
  it('calculates a rounded weighted percentage', () => {
    expect(calculateWeightedScore(1.23456, 2)).toBe(61.73);
  });

  it('returns no score when there is no positive weight', () => {
    expect(calculateWeightedScore(0, 0)).toBeNull();
  });

  it.each([
    [25, 'EXPLORADOR'],
    [25.01, 'USUARIO'],
    [50, 'USUARIO'],
    [50.01, 'IMPULSOR'],
    [75, 'IMPULSOR'],
    [75.01, 'EMBAJADOR'],
  ] as const)('assigns score %s to rank %s', (score, expectedRank) => {
    expect(resolveRank(score)).toBe(expectedRank);
  });
});
