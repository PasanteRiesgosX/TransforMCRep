import { AiFeedbackStatus } from '../domain/survey-models';

export const REALTIME_FEEDBACK = Symbol('REALTIME_FEEDBACK');

export interface RealtimeFeedbackPort {
  authorizeChannel(socketId: string, channelName: string): { auth: string };
  notifyFeedbackUpdated(userId: string, attemptId: string, status: AiFeedbackStatus): Promise<void>;
}