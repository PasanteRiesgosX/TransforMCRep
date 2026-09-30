export interface SurveyOptionRecord {
  id: string;
  text: string;
  value: number;
  isPassing: boolean;
  orderIndex: number;
  isActive: boolean;
}

export interface SurveyQuestionRecord {
  id: string;
  text: string;
  type: string;
  dimension: string | null;
  weight: number;
  isGate: boolean;
  scoreEligible: boolean;
  orderIndex: number;
  isActive: boolean;
  minValue: number | null;
  maxValue: number | null;
  stepValue: number | null;
  minLabel: string | null;
  maxLabel: string | null;
  passingValue: number | null;
  options: SurveyOptionRecord[];
}

export interface SurveyAnswerRecord {
  id: string;
  attemptId: string;
  questionId: string;
  questionTextSnapshot: string;
  questionTypeSnapshot: string;
  dimensionSnapshot: string | null;
  weightSnapshot: number;
  selectedOptionId: string | null;
  optionTextSnapshot: string | null;
  optionValueSnapshot: number | null;
  numericValue: number | null;
  textValue: string | null;
}

export interface SurveyAttemptData {
  id: string;
  subjectUserId: string;
  evaluatorUserId: string;
  evaluationType: string;
  status: string;
  currentPage: number;
  startedAt: Date;
  submittedAt: Date | null;
  payloadJson: string | null;
  aiFeedbackJson: string | null;
  aiFeedbackStatus: AiFeedbackStatus;
}

export type AiFeedbackStatus = 'NOT_REQUESTED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface SurveyAttemptRecord extends SurveyAttemptData {
  answers: SurveyAnswerRecord[];
}

export interface SurveyAnswerInput {
  questionId: string;
  selectedOptionId?: string | null;
  numericValue?: number | null;
  textValue?: string | null;
}

export interface SurveyProgressInput {
  currentPage?: number;
  answers?: SurveyAnswerInput[];
}

export interface SurveyScoringSnapshot {
  answers: SurveyAnswerRecord[];
  questions: SurveyQuestionRecord[];
}