import { parseAiFeedbackResult } from './ai-feedback-result';

const validResult = {
  conocimientoGeneral: 80,
  usoHerramientas: 65,
  identificacionOportunidades: 70,
  usoResponsable: 90,
  disposicionImpulsar: 85,
  superpoderes: '¡Demuestras un excelente nivel para liderar la innovación tecnológica!',
  siguienteReto: 'Prueba incorporar automatizaciones en tus tareas semanales.',
};

describe('parseAiFeedbackResult', () => {
  it('accepts exactly the five integer scores in range', () => {
    expect(parseAiFeedbackResult(validResult)).toEqual(validResult);
  });

  it.each([
    null,
    [],
    { ...validResult, extra: 1 },
    { ...validResult, conocimientoGeneral: 101 },
    { ...validResult, conocimientoGeneral: 1.5 },
    { ...validResult, conocimientoGeneral: '80' },
    Object.fromEntries(Object.entries(validResult).slice(1)),
  ])('rejects invalid feedback: %j', invalidResult => {
    expect(() => parseAiFeedbackResult(invalidResult)).toThrow();
  });
});