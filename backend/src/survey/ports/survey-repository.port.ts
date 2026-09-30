import {
  SurveyAnswerInput,
  AiFeedbackStatus,
  SurveyAttemptData,
  SurveyAttemptRecord,
  SurveyQuestionRecord,
  SurveyScoringSnapshot,
} from '../domain/survey-models';

export const SURVEY_REPOSITORY = Symbol('SURVEY_REPOSITORY');

export interface SurveyRepository {
  listActiveQuestions(): Promise<SurveyQuestionRecord[]>;
  findActiveAttempt(userId: string): Promise<SurveyAttemptRecord | null>;
  createActiveAttempt(userId: string): Promise<SurveyAttemptRecord>;
  findAttemptById(attemptId: string): Promise<SurveyAttemptRecord | null>;
  saveProgress(
    attemptId: string,
    currentPage: number,
    answers: SurveyAnswerInput[],
  ): Promise<SurveyAttemptRecord>;
  findQuestionsByIds(questionIds: string[]): Promise<SurveyQuestionRecord[]>;
  markSubmitted(
    attemptId: string,
    submittedAt: Date,
    payloadJson: string,
  ): Promise<SurveyAttemptData>;
  saveAiFeedback(attemptId: string, aiFeedbackJson: string): Promise<void>;
  setAiFeedbackStatus(attemptId: string, status: AiFeedbackStatus): Promise<void>;
  getFeedbackPayload(attemptId: string): Promise<{
    payloadJson: string;
    subjectUserId: string;
    aiFeedbackStatus: AiFeedbackStatus;
  } | null>;
  findLatestSubmittedAttempt(userId: string): Promise<SurveyAttemptData | null>;
  getScoringSnapshot(attemptId: string): Promise<SurveyScoringSnapshot | null>;
}