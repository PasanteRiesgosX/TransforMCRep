export type AiProviderFailureKind = 'TRANSIENT' | 'CAPACITY' | 'FATAL' | 'INVALID_RESPONSE';

export class AiProviderError extends Error {
  constructor(
    readonly kind: AiProviderFailureKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = AiProviderError.name;
  }
}

export class AiFeedbackUnavailableError extends Error {
  constructor() {
    super('All configured AI models failed to produce feedback');
    this.name = AiFeedbackUnavailableError.name;
  }
}