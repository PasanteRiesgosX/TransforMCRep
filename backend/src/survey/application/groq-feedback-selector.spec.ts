import { AiFeedbackResult } from '../domain/ai-feedback-result';
import { AiFeedbackUnavailableError, AiProviderError } from '../domain/ai-provider-error';
import { AiFeedbackProvider } from '../ports/ai-feedback-provider.port';
import { AiCallRateLimiter } from '../ports/ai-call-rate-limiter.port';
import { GROQ_FEEDBACK_MODELS, GroqFeedbackSelector } from './groq-feedback-selector';

const feedback: AiFeedbackResult = {
  conocimientoGeneral: 80,
  usoHerramientas: 65,
  identificacionOportunidades: 70,
  usoResponsable: 90,
  disposicionImpulsar: 85,
};

function createSelector(generateFeedback: jest.Mock) {
  const provider = { generateFeedback } as unknown as AiFeedbackProvider;
  const waitForPermit = jest.fn().mockResolvedValue(undefined);
  const rateLimiter = { waitForPermit } as AiCallRateLimiter;
  return { selector: new GroqFeedbackSelector(provider, rateLimiter), waitForPermit };
}

describe('GroqFeedbackSelector', () => {
  it('moves to the next model immediately on capacity errors', async () => {
    const generateFeedback = jest.fn()
      .mockRejectedValueOnce(new AiProviderError('CAPACITY', 'rate limited'))
      .mockResolvedValueOnce(feedback);
    const { selector, waitForPermit } = createSelector(generateFeedback);

    await expect(selector.generateFeedback('{}')).resolves.toEqual(feedback);

    expect(generateFeedback.mock.calls).toEqual([
      ['{}', GROQ_FEEDBACK_MODELS[0]],
      ['{}', GROQ_FEEDBACK_MODELS[1]],
    ]);
    expect(waitForPermit).toHaveBeenCalledTimes(2);
  });

  it('retries a transient failure once on the same model', async () => {
    const generateFeedback = jest.fn()
      .mockRejectedValueOnce(new AiProviderError('TRANSIENT', 'temporary'))
      .mockResolvedValueOnce(feedback);
    const { selector, waitForPermit } = createSelector(generateFeedback);

    await expect(selector.generateFeedback('{}')).resolves.toEqual(feedback);

    expect(generateFeedback.mock.calls).toEqual([
      ['{}', GROQ_FEEDBACK_MODELS[0]],
      ['{}', GROQ_FEEDBACK_MODELS[0]],
    ]);
    expect(waitForPermit).toHaveBeenCalledTimes(2);
  });

  it('does not fallback after a fatal provider error', async () => {
    const generateFeedback = jest.fn().mockRejectedValue(
      new AiProviderError('FATAL', 'invalid API key'),
    );
    const { selector } = createSelector(generateFeedback);

    await expect(selector.generateFeedback('{}')).rejects.toMatchObject({ kind: 'FATAL' });
    expect(generateFeedback).toHaveBeenCalledTimes(1);
  });

  it('returns unavailable after capacity failures exhaust all models', async () => {
    const generateFeedback = jest.fn().mockRejectedValue(
      new AiProviderError('CAPACITY', 'model unavailable'),
    );
    const { selector } = createSelector(generateFeedback);

    await expect(selector.generateFeedback('{}')).rejects.toBeInstanceOf(AiFeedbackUnavailableError);
    expect(generateFeedback).toHaveBeenCalledTimes(GROQ_FEEDBACK_MODELS.length);
  });
});