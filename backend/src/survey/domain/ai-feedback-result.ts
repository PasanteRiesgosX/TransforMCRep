export interface AiFeedbackResult {
  conocimientoGeneral: number;
  usoHerramientas: number;
  identificacionOportunidades: number;
  usoResponsable: number;
  disposicionImpulsar: number;
}

const aiFeedbackKeys: (keyof AiFeedbackResult)[] = [
  'conocimientoGeneral',
  'usoHerramientas',
  'identificacionOportunidades',
  'usoResponsable',
  'disposicionImpulsar',
];

export function parseAiFeedbackResult(value: unknown): AiFeedbackResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('AI feedback must be a JSON object');
  }

  const result = value as Record<string, unknown>;
  const keys = Object.keys(result);
  if (keys.length !== aiFeedbackKeys.length || aiFeedbackKeys.some(key => !keys.includes(key))) {
    throw new Error('AI feedback has an unexpected shape');
  }

  for (const key of aiFeedbackKeys) {
    const score = result[key];
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 100) {
      throw new Error(`AI feedback field ${key} must be an integer from 0 to 100`);
    }
  }

  return result as unknown as AiFeedbackResult;
}