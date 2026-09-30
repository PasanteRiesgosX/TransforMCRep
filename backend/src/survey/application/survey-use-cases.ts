import { parseAiFeedbackResult } from '../domain/ai-feedback-result';
import { calculateSurveyResults, DeterministicResult } from '../domain/scoring';
import { SurveyAttemptNotFoundError, SurveyRequestError } from '../domain/survey-errors';
import {
  SurveyAnswerInput,
  SurveyAttemptRecord,
  SurveyProgressInput,
} from '../domain/survey-models';
import { buildSurveyPayload } from '../survey-payload.builder';
import { FeedbackDispatcher } from '../ports/feedback-dispatcher.port';
import { SurveyRepository } from '../ports/survey-repository.port';

export class GetSurveyQuestionsUseCase {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  async execute() {
    const questions = await this.surveyRepository.listActiveQuestions();
    return questions.map(question => ({
      id: question.id,
      text: question.text,
      type: question.type,
      orderIndex: question.orderIndex,
      minValue: question.minValue,
      maxValue: question.maxValue,
      stepValue: question.stepValue,
      minLabel: question.minLabel,
      maxLabel: question.maxLabel,
      options: question.options.map(option => ({
        id: option.id,
        text: option.text,
        orderIndex: option.orderIndex,
      })),
    }));
  }
}

export class GetActiveSurveyAttemptUseCase {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  async execute(userId: string): Promise<SurveyAttemptRecord> {
    return await this.surveyRepository.findActiveAttempt(userId)
      ?? this.surveyRepository.createActiveAttempt(userId);
  }
}

export class SaveSurveyProgressUseCase {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  async execute(
    userId: string,
    attemptId: string,
    progress: SurveyProgressInput,
  ): Promise<SurveyAttemptRecord> {
    const attempt = await this.surveyRepository.findAttemptById(attemptId);
    if (!attempt) throw new SurveyAttemptNotFoundError();
    if (attempt.subjectUserId !== userId) throw new SurveyRequestError('Not your attempt');
    if (attempt.status === 'SUBMITTED') throw new SurveyRequestError('Attempt already submitted');

    return this.surveyRepository.saveProgress(
      attemptId,
      progress.currentPage ?? attempt.currentPage,
      progress.answers ?? [],
    );
  }
}

export class SubmitSurveyAttemptUseCase {
  constructor(
    private readonly surveyRepository: SurveyRepository,
    private readonly saveProgress: SaveSurveyProgressUseCase,
    private readonly feedbackDispatcher: FeedbackDispatcher,
  ) {}

  async execute(
    userId: string,
    attemptId: string,
    answers: SurveyAnswerInput[],
  ) {
    await this.saveProgress.execute(userId, attemptId, { answers });
    const attempt = await this.surveyRepository.findAttemptById(attemptId);
    if (!attempt) throw new SurveyAttemptNotFoundError();
    if (attempt.status === 'SUBMITTED') throw new SurveyRequestError('Attempt already submitted');

    const questions = await this.surveyRepository.findQuestionsByIds(
      attempt.answers.map(answer => answer.questionId),
    );
    const questionMap = new Map(questions.map(question => [question.id, question]));
    const finalAnswers = attempt.answers.map(answer => {
      const question = questionMap.get(answer.questionId);
      let computedNormalizedValue: number | null = null;
      if (
        question?.type === 'SLIDER' &&
        answer.numericValue !== null &&
        question.minValue !== null &&
        question.maxValue !== null
      ) {
        computedNormalizedValue = Number(
          ((answer.numericValue - question.minValue) / (question.maxValue - question.minValue)).toFixed(4),
        );
      }
      return { ...answer, computedNormalizedValue };
    });

    const submittedAt = new Date();
    const payloadJson = JSON.stringify(buildSurveyPayload({ ...attempt, submittedAt }, finalAnswers));
    const submittedAttempt = await this.surveyRepository.markSubmitted(attempt.id, submittedAt, payloadJson);
    await this.feedbackDispatcher.dispatch(attempt.id);
    return submittedAttempt;
  }
}

export class GetSurveyResultsUseCase {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  async execute(userId: string) {
    const attempt = await this.surveyRepository.findLatestSubmittedAttempt(userId);
    if (!attempt) throw new SurveyAttemptNotFoundError('No submitted attempt found for this user');

    const snapshot = await this.surveyRepository.getScoringSnapshot(attempt.id);
    const results: DeterministicResult = snapshot
      ? calculateSurveyResults(snapshot.answers, snapshot.questions)
      : calculateSurveyResults([], []);

    let aiFeedback = null;
    if (attempt.aiFeedbackJson) {
      try {
        aiFeedback = parseAiFeedbackResult(JSON.parse(attempt.aiFeedbackJson) as unknown);
      } catch {
        aiFeedback = null;
      }
    }

    return {
      overallScore: results.overallScore,
      range: results.range,
      description: this.getRangeDescription(results.range),
      dimensions: results.dimensions,
      aiFeedback,
      aiFeedbackStatus: attempt.aiFeedbackStatus,
    };
  }

  private getRangeDescription(range: DeterministicResult['range']): string {
    switch (range) {
      case 'EXPLORADOR':
        return 'Tienes conocimientos iniciales. Es un buen momento para explorar y capacitarte en los conceptos fundamentales.';
      case 'USUARIO':
        return 'Cuentas con bases sólidas. Tienes buenas oportunidades de mejora para consolidar tus prácticas.';
      case 'IMPULSOR':
        return 'Demuestras un dominio alto. Tienes capacidad de aplicación y puedes liderar iniciativas en tu área.';
      case 'EMBAJADOR':
        return 'Eres un referente destacado. Impulsas a otros y demuestras excelencia sostenida.';
      default:
        return 'Resultado no disponible.';
    }
  }
}