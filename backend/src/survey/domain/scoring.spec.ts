import { calculateSurveyResults } from './scoring';
import { SurveyAnswerRecord, SurveyQuestionRecord } from './survey-models';

function createQuestion(overrides: Partial<SurveyQuestionRecord> = {}): SurveyQuestionRecord {
  return {
    id: 'question-1',
    text: 'Question',
    type: 'MULTIPLE_CHOICE',
    dimension: 'Knowledge',
    weight: 1,
    isGate: false,
    scoreEligible: true,
    orderIndex: 0,
    isActive: true,
    minValue: null,
    maxValue: null,
    stepValue: null,
    minLabel: null,
    maxLabel: null,
    passingValue: null,
    options: [],
    ...overrides,
  };
}

function createAnswer(overrides: Partial<SurveyAnswerRecord> = {}): SurveyAnswerRecord {
  return {
    id: 'answer-1',
    attemptId: 'attempt-1',
    questionId: 'question-1',
    questionTextSnapshot: 'Question',
    questionTypeSnapshot: 'MULTIPLE_CHOICE',
    dimensionSnapshot: 'Knowledge',
    weightSnapshot: 1,
    selectedOptionId: 'option-1',
    optionTextSnapshot: 'Selected',
    optionValueSnapshot: 0.75,
    numericValue: null,
    textValue: null,
    ...overrides,
  };
}

describe('calculateSurveyResults', () => {
  it('calculates weighted score, rank, and dimension values', () => {
    const result = calculateSurveyResults(
      [createAnswer()],
      [createQuestion()],
    );

    expect(result.overallScore).toBe(75);
    expect(result.range).toBe('IMPULSOR');
    expect(result.dimensions).toEqual([
      { dimension: 'Knowledge', score: 75, questionCount: 1 },
    ]);
  });

  it('excludes failed gate questions from the score', () => {
    const result = calculateSurveyResults(
      [createAnswer()],
      [createQuestion({
        isGate: true,
        options: [{
          id: 'option-1',
          text: 'Selected',
          value: 0.75,
          isPassing: false,
          orderIndex: 0,
          isActive: true,
        }],
      })],
    );

    expect(result.overallScore).toBeNull();
    expect(result.internalEligibility).toEqual({ isEligible: false, failedGateIds: ['question-1'] });
  });

  it('normalizes slider values against their configured range', () => {
    const result = calculateSurveyResults(
      [createAnswer({
        questionTypeSnapshot: 'SLIDER',
        optionValueSnapshot: null,
        numericValue: 5,
      })],
      [createQuestion({ type: 'SLIDER', minValue: 0, maxValue: 10 })],
    );

    expect(result.overallScore).toBe(50);
  });
});