import { Injectable } from '@nestjs/common';
import { AiFeedbackResult } from '../domain/ai-feedback-result';
import { AiFeedbackUnavailableError, AiProviderError } from '../domain/ai-provider-error';
import type { AiFeedbackProvider } from '../ports/ai-feedback-provider.port';
import type { AiCallRateLimiter } from '../ports/ai-call-rate-limiter.port';

@Injectable()
export class GroqFeedbackSelector {
  constructor(
    private readonly provider: AiFeedbackProvider,
    private readonly rateLimiter: AiCallRateLimiter,
    private readonly models: string[],
  ) {}

  async generateFeedback(payloadJson: string): Promise<AiFeedbackResult> {
    if (this.models.length === 0) {
      throw new AiFeedbackUnavailableError();
    }

    for (const modelId of this.models) {
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