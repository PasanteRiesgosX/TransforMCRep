import { Injectable } from '@nestjs/common';
import { AiFeedbackResult } from '../domain/ai-feedback-result';
import { AiFeedbackUnavailableError, AiProviderError } from '../domain/ai-provider-error';
import type { AiFeedbackProvider } from '../ports/ai-feedback-provider.port';
import type { AiCallRateLimiter } from '../ports/ai-call-rate-limiter.port';


export const GROQ_FEEDBACK_MODELS = [
  'openai/gpt-oss-20b',      // Principal (ultrarrápido, 1000 t/s, soporte json_mode)
  'qwen/qwen3.8-27b',        // Fallback 1 (muy preciso en JSON y estructuración)
  'openai/gpt-oss-120b',     // Fallback 2 (máxima capacidad y razonamiento)
] as const;

@Injectable()
export class GroqFeedbackSelector {
  constructor(
    private readonly provider: AiFeedbackProvider,
    private readonly rateLimiter: AiCallRateLimiter,
  ) {}

  async generateFeedback(payloadJson: string): Promise<AiFeedbackResult> {
    for (const modelId of GROQ_FEEDBACK_MODELS) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        await this.rateLimiter.waitForPermit();

        try {
          return await this.provider.generateFeedback(payloadJson, modelId);
        } catch (error) {
          if (!(error instanceof AiProviderError)) throw error;
          if (error.kind === 'FATAL') throw error;
          if (error.kind === 'CAPACITY' || error.kind === 'INVALID_RESPONSE') break;
          if (attempt === 2) break;

          await new Promise(resolve => setTimeout(resolve, 500 * (2 ** (attempt - 1))));
        }
      }
    }

    throw new AiFeedbackUnavailableError();
  }
}