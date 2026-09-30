export const AI_CALL_RATE_LIMITER = Symbol('AI_CALL_RATE_LIMITER');

export interface AiCallRateLimiter {
  waitForPermit(): Promise<void>;
}