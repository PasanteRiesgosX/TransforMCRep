import { AiFeedbackResult } from '../domain/ai-feedback-result';

export const AI_FEEDBACK_PROVIDER = Symbol('AI_FEEDBACK_PROVIDER');

export interface AiFeedbackProvider {
  generateFeedback(payloadJson: string, modelId: string): Promise<AiFeedbackResult>;


  
}