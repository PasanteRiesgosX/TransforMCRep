export interface AiFeedbackResult {
  conocimientoGeneral: number;
  usoHerramientas: number;
  identificacionOportunidades: number;
  usoResponsable: number;
  disposicionImpulsar: number;
  superpoderes: string;
  siguienteReto: string;
}

const aiFeedbackKeys: (keyof Omit<AiFeedbackResult, 'superpoderes' | 'siguienteReto'>)[] = [
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

  for (const key of aiFeedbackKeys) {
    const score = result[key];
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 100) {
      throw new Error(`AI feedback field ${key} must be an integer from 0 to 100`);
    }
  }

  const superpoderes = typeof result.superpoderes === 'string' && result.superpoderes.trim().length > 0
    ? result.superpoderes.trim()
    : '¡Demuestras un gran potencial para cultivar la Inteligencia Artificial y seguir impulsando la innovación en tu área!';

  const siguienteReto = typeof result.siguienteReto === 'string' && result.siguienteReto.trim().length > 0
    ? result.siguienteReto.trim()
    : 'Continúa explorando nuevas herramientas de IA en tu trabajo diario para seguir creciendo.';

  return {
    conocimientoGeneral: result.conocimientoGeneral as number,
    usoHerramientas: result.usoHerramientas as number,
    identificacionOportunidades: result.identificacionOportunidades as number,
    usoResponsable: result.usoResponsable as number,
    disposicionImpulsar: result.disposicionImpulsar as number,
    superpoderes,
    siguienteReto,
  };
}