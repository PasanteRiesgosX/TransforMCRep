import { SaveSurveyProgressUseCase, SubmitSurveyAttemptUseCase } from './survey-use-cases';
import { SurveyRequestError } from '../domain/survey-errors';
import { SurveyAttemptRecord, SurveyQuestionRecord } from '../domain/survey-models';
import { SurveyRepository } from '../ports/survey-repository.port';
import { FeedbackDispatcher } from '../ports/feedback-dispatcher.port';

const attempt: SurveyAttemptRecord = {
  id: 'attempt-1',
  subjectUserId: 'user-1',
  evaluatorUserId: 'user-1',
  evaluationType: 'AUTOEVALUACION',
  status: 'IN_PROGRESS',
  currentPage: 2,
  startedAt: new Date('2026-09-01T00:00:00.000Z'),
  submittedAt: null,
  payloadJson: null,
  aiFeedbackJson: null,
  aiFeedbackStatus: 'NOT_REQUESTED',
  answers: [{
    id: 'answer-1',
    attemptId: 'attempt-1',
    questionId: 'question-1',
    questionTextSnapshot: 'Slider question',
    questionTypeSnapshot: 'SLIDER',
    dimensionSnapshot: 'Tools',
    weightSnapshot: 1,
    selectedOptionId: null,
    optionTextSnapshot: null,
    optionValueSnapshot: null,
    numericValue: 5,
    textValue: null,
  }],
};

const sliderQuestion: SurveyQuestionRecord = {
  id: 'question-1',
  text: 'Slider question',
  type: 'SLIDER',
  dimension: 'Tools',
  weight: 1,
  isGate: false,
  scoreEligible: true,
  orderIndex: 0,
  isActive: true,
  minValue: 0,
  maxValue: 10,
  stepValue: 1,
  minLabel: null,
  maxLabel: null,
  passingValue: null,
  options: [],
};

describe('survey use cases', () => {
  it('rejects attempts owned by another user before saving progress', async () => {
    const saveProgress = jest.fn();
    const repository = {
      findAttemptById: jest.fn().mockResolvedValue(attempt),
      saveProgress,
    } as unknown as SurveyRepository;
    const useCase = new SaveSurveyProgressUseCase(repository);

    await expect(useCase.execute('other-user', attempt.id, {})).rejects.toBeInstanceOf(SurveyRequestError);
    expect(saveProgress).not.toHaveBeenCalled();
  });

  it('builds the canonical slider payload and dispatches feedback after submission', async () => {
    const savedAttempt = { ...attempt, status: 'SUBMITTED', aiFeedbackStatus: 'PENDING' as const };
    const markSubmitted = jest.fn().mockResolvedValue(savedAttempt);
    const repository = {
      findAttemptById: jest.fn().mockResolvedValue(attempt),
      findQuestionsByIds: jest.fn().mockResolvedValue([sliderQuestion]),
      markSubmitted,
    } as unknown as SurveyRepository;
    const saveProgress = {
      execute: jest.fn().mockResolvedValue(attempt),
    } as unknown as SaveSurveyProgressUseCase;
    const dispatch = jest.fn().mockResolvedValue(undefined);
    const feedbackDispatcher = { dispatch } as FeedbackDispatcher;
    const useCase = new SubmitSurveyAttemptUseCase(repository, saveProgress, feedbackDispatcher);

    await expect(useCase.execute('user-1', attempt.id, [])).resolves.toEqual(savedAttempt);

    const payloadJson = markSubmitted.mock.calls[0][2] as string;
    expect(JSON.parse(payloadJson).answers[0].value).toBe(0.5);
    expect(dispatch).toHaveBeenCalledWith(attempt.id);
    expect(markSubmitted).toHaveBeenCalledWith(
      attempt.id,
      expect.any(Date),
      payloadJson,
    );
  });
});