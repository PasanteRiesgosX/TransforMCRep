export const FEEDBACK_DISPATCHER = Symbol('FEEDBACK_DISPATCHER');

export interface FeedbackDispatcher {
  dispatch(attemptId: string): Promise<void>;
}


