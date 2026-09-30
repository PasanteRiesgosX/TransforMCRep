import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AiFeedbackStatus,
  SurveyAnswerInput,
  SurveyAnswerRecord,
  SurveyAttemptData,
  SurveyAttemptRecord,
  SurveyQuestionRecord,
  SurveyScoringSnapshot,
} from '../../domain/survey-models';
import { SurveyRepository } from '../../ports/survey-repository.port';

type QuestionWithOptions = Prisma.QuestionGetPayload<{ include: { options: true } }>;
type AttemptWithAnswers = Prisma.SurveyAttemptGetPayload<{ include: { answers: true } }>;
type AnswerRecord = Prisma.AnswerGetPayload<Record<string, never>>;

@Injectable()
export class PrismaSurveyRepository implements SurveyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listActiveQuestions(): Promise<SurveyQuestionRecord[]> {
    const questions = await this.prisma.question.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        options: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return questions.map(question => this.toQuestionRecord(question));
  }

  async findActiveAttempt(userId: string): Promise<SurveyAttemptRecord | null> {
    const attempt = await this.prisma.surveyAttempt.findFirst({
      where: {
        subjectUserId: userId,
        evaluatorUserId: userId,
        status: 'IN_PROGRESS',
      },
      include: { answers: true },
    });

    return attempt ? this.toAttemptRecord(attempt) : null;
  }

  async createActiveAttempt(userId: string): Promise<SurveyAttemptRecord> {
    const attempt = await this.prisma.surveyAttempt.create({
      data: {
        subjectUserId: userId,
        evaluatorUserId: userId,
        status: 'IN_PROGRESS',
        currentPage: 0,
      },
      include: { answers: true },
    });

    return this.toAttemptRecord(attempt);
  }

  async findAttemptById(attemptId: string): Promise<SurveyAttemptRecord | null> {
    const attempt = await this.prisma.surveyAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });

    return attempt ? this.toAttemptRecord(attempt) : null;
  }

  async saveProgress(
    attemptId: string,
    currentPage: number,
    answers: SurveyAnswerInput[],
  ): Promise<SurveyAttemptRecord> {
    const attempt = await this.prisma.$transaction(async tx => {
      if (answers.length > 0) {
        const questionIds = answers.map(answer => answer.questionId);
        await tx.answer.deleteMany({
          where: { attemptId, questionId: { in: questionIds } },
        });

        for (const answer of answers) {
          const question = await tx.question.findUnique({
            where: { id: answer.questionId },
            include: { options: true },
          });
          if (!question) continue;

          let selectedOptionId: string | null = null;
          let optionTextSnapshot: string | null = null;
          let optionValueSnapshot: Prisma.Decimal | null = null;
          let numericValue: number | null = null;

          if (question.type === 'MULTIPLE_CHOICE') {
            const option = question.options.find(item => item.id === answer.selectedOptionId);
            if (option) {
              selectedOptionId = option.id;
              optionTextSnapshot = option.text;
              optionValueSnapshot = option.value;
            }
          } else if (question.type === 'SLIDER') {
            numericValue = answer.numericValue ?? null;
          }

          await tx.answer.create({
            data: {
              attemptId,
              questionId: question.id,
              questionTextSnapshot: question.text,
              questionTypeSnapshot: question.type,
              dimensionSnapshot: question.dimension,
              weightSnapshot: question.weight,
              selectedOptionId,
              optionTextSnapshot,
              optionValueSnapshot,
              numericValue,
            },
          });
        }
      }

      return tx.surveyAttempt.update({
        where: { id: attemptId },
        data: { currentPage },
        include: { answers: true },
      });
    });

    return this.toAttemptRecord(attempt);
  }

  async findQuestionsByIds(questionIds: string[]): Promise<SurveyQuestionRecord[]> {
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });

    return questions.map(question => this.toQuestionRecord(question));
  }

  async markSubmitted(
    attemptId: string,
    submittedAt: Date,
    payloadJson: string,
  ): Promise<SurveyAttemptData> {
    const attempt = await this.prisma.surveyAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt,
        payloadJson,
        aiFeedbackStatus: 'PENDING',
        aiFeedbackJson: null,
      },
    });

    return this.toAttemptData(attempt);
  }

  async saveAiFeedback(attemptId: string, aiFeedbackJson: string): Promise<void> {
    await this.prisma.surveyAttempt.update({
      where: { id: attemptId },
      data: { aiFeedbackJson, aiFeedbackStatus: 'COMPLETED' },
    });
  }

  async setAiFeedbackStatus(attemptId: string, status: AiFeedbackStatus): Promise<void> {
    await this.prisma.surveyAttempt.update({
      where: { id: attemptId },
      data: { aiFeedbackStatus: status },
    });
  }

  async getFeedbackPayload(
    attemptId: string,
  ): Promise<{ payloadJson: string; subjectUserId: string; aiFeedbackStatus: AiFeedbackStatus } | null> {
    const attempt = await this.prisma.surveyAttempt.findUnique({
      where: { id: attemptId },
      select: { payloadJson: true, subjectUserId: true, aiFeedbackStatus: true },
    });

    if (!attempt?.payloadJson) return null;
    return {
      payloadJson: attempt.payloadJson,
      subjectUserId: attempt.subjectUserId,
      aiFeedbackStatus: attempt.aiFeedbackStatus as AiFeedbackStatus,
    };
  }

  async findLatestSubmittedAttempt(userId: string): Promise<SurveyAttemptData | null> {
    const attempt = await this.prisma.surveyAttempt.findFirst({
      where: { subjectUserId: userId, status: 'SUBMITTED' },
      orderBy: { submittedAt: 'desc' },
    });

    return attempt ? this.toAttemptData(attempt) : null;
  }

  async getScoringSnapshot(attemptId: string): Promise<SurveyScoringSnapshot | null> {
    const [attempt, questions] = await Promise.all([
      this.prisma.surveyAttempt.findUnique({
        where: { id: attemptId },
        include: { answers: true },
      }),
      this.prisma.question.findMany({ include: { options: true } }),
    ]);

    if (!attempt) return null;

    return {
      answers: attempt.answers.map(answer => this.toAnswerRecord(answer)),
      questions: questions.map(question => this.toQuestionRecord(question)),
    };
  }

  private toQuestionRecord(question: QuestionWithOptions): SurveyQuestionRecord {
    return {
      id: question.id,
      text: question.text,
      type: question.type,
      dimension: question.dimension,
      weight: Number(question.weight),
      isGate: question.isGate,
      scoreEligible: question.scoreEligible,
      orderIndex: question.orderIndex,
      isActive: question.isActive,
      minValue: question.minValue,
      maxValue: question.maxValue,
      stepValue: question.stepValue,
      minLabel: question.minLabel,
      maxLabel: question.maxLabel,
      passingValue: question.passingValue,
      options: question.options.map(option => ({
        id: option.id,
        text: option.text,
        value: Number(option.value),
        isPassing: option.isPassing,
        orderIndex: option.orderIndex,
        isActive: option.isActive,
      })),
    };
  }

  private toAnswerRecord(answer: AnswerRecord): SurveyAnswerRecord {
    return {
      id: answer.id,
      attemptId: answer.attemptId,
      questionId: answer.questionId,
      questionTextSnapshot: answer.questionTextSnapshot,
      questionTypeSnapshot: answer.questionTypeSnapshot,
      dimensionSnapshot: answer.dimensionSnapshot,
      weightSnapshot: Number(answer.weightSnapshot),
      selectedOptionId: answer.selectedOptionId,
      optionTextSnapshot: answer.optionTextSnapshot,
      optionValueSnapshot: answer.optionValueSnapshot === null ? null : Number(answer.optionValueSnapshot),
      numericValue: answer.numericValue,
      textValue: answer.textValue,
    };
  }

  private toAttemptData(attempt: Prisma.SurveyAttemptGetPayload<Record<string, never>>): SurveyAttemptData {
    return {
      id: attempt.id,
      subjectUserId: attempt.subjectUserId,
      evaluatorUserId: attempt.evaluatorUserId,
      evaluationType: attempt.evaluationType,
      status: attempt.status,
      currentPage: attempt.currentPage,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      payloadJson: attempt.payloadJson,
      aiFeedbackJson: attempt.aiFeedbackJson,
      aiFeedbackStatus: attempt.aiFeedbackStatus as AiFeedbackStatus,
    };
  }

  private toAttemptRecord(attempt: AttemptWithAnswers): SurveyAttemptRecord {
    return {
      ...this.toAttemptData(attempt),
      answers: attempt.answers.map(answer => this.toAnswerRecord(answer)),
    };
  }
}