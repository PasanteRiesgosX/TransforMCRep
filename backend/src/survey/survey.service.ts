import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildSurveyPayload } from './survey-payload.builder';
import { ScoringService } from './scoring.service';
import { AiFeedbackService } from './ai-feedback.service';

@Injectable()
export class SurveyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService,
    private readonly aiService: AiFeedbackService,
  ) {}

  async getQuestions() {
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

    return questions.map(q => {
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        orderIndex: q.orderIndex,
        // Only for SLIDER
        minValue: q.minValue,
        maxValue: q.maxValue,
        stepValue: q.stepValue,
        minLabel: q.minLabel,
        maxLabel: q.maxLabel,
        // Options for MULTIPLE_CHOICE (omitting value)
        options: q.options.map(o => ({
          id: o.id,
          text: o.text,
          orderIndex: o.orderIndex,
        })),
      };
    });
  }

  async getActiveAttempt(userId: string) {
    let attempt = await this.prisma.surveyAttempt.findFirst({
      where: {
        subjectUserId: userId,
        evaluatorUserId: userId,
        status: 'IN_PROGRESS',
      },
      include: {
        answers: true,
      }
    });

    if (!attempt) {
      attempt = await this.prisma.surveyAttempt.create({
        data: {
          subjectUserId: userId,
          evaluatorUserId: userId,
          status: 'IN_PROGRESS',
          currentPage: 0,
        },
        include: {
          answers: true,
        }
      });
    }

    return attempt;
  }

  async saveProgress(userId: string, attemptId: string, progressDto: { currentPage?: number, answers?: any[] }) {
    const attempt = await this.prisma.surveyAttempt.findUnique({
      where: { id: attemptId }
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.subjectUserId !== userId) throw new BadRequestException('Not your attempt');
    if (attempt.status === 'SUBMITTED') throw new BadRequestException('Attempt already submitted');

    return this.prisma.$transaction(async (tx) => {
      // If there are answers to save
      if (progressDto.answers && progressDto.answers.length > 0) {
        const questionIds = progressDto.answers.map((a: any) => a.questionId);
        
        // Remove old answers for these questions
        await tx.answer.deleteMany({
          where: {
            attemptId,
            questionId: { in: questionIds }
          }
        });

        // Insert new answers
        for (const ans of progressDto.answers) {
          const q = await tx.question.findUnique({
            where: { id: ans.questionId },
            include: { options: true }
          });
          if (!q) continue;

          let selectedOptionId = null;
          let optionTextSnapshot = null;
          let optionValueSnapshot = null;
          let numericValue = null;

          if (q.type === 'MULTIPLE_CHOICE') {
            const opt = q.options.find(o => o.id === ans.selectedOptionId);
            if (opt) {
              selectedOptionId = opt.id;
              optionTextSnapshot = opt.text;
              optionValueSnapshot = opt.value;
            }
          } else if (q.type === 'SLIDER') {
            numericValue = ans.numericValue;
          }

          await tx.answer.create({
            data: {
              attemptId,
              questionId: q.id,
              questionTextSnapshot: q.text,
              questionTypeSnapshot: q.type,
              dimensionSnapshot: q.dimension,
              weightSnapshot: q.weight,
              selectedOptionId,
              optionTextSnapshot,
              optionValueSnapshot,
              numericValue,
            }
          });
        }
      }

      // Update current page
      const updated = await tx.surveyAttempt.update({
        where: { id: attemptId },
        data: {
          currentPage: progressDto.currentPage !== undefined ? progressDto.currentPage : attempt.currentPage,
        },
        include: {
          answers: true,
        }
      });
      return updated;
    });
  }

  async submitAttempt(userId: string, attemptId: string, answersDto: any) {
    // Save any pending answers before final submission
    await this.saveProgress(userId, attemptId, { answers: answersDto });

    const attempt = await this.prisma.surveyAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true }
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    if (attempt.status === 'SUBMITTED') {
      throw new BadRequestException('Attempt already submitted');
    }

    // Now recalculate normalized values for canonical payload
    const savedAnswers = attempt.answers.map(ans => {
      let computedNormalizedValue = null;
      if (ans.questionTypeSnapshot === 'SLIDER' && ans.numericValue !== null) {
        // We need the original question to normalize
        // We will fetch all questions here
      }
      return ans;
    });

    // Actually, to get normalized value for canonical JSON, we need original question min/max
    const questions = await this.prisma.question.findMany({
      where: { id: { in: attempt.answers.map(a => a.questionId) } }
    });
    const qMap = new Map(questions.map(q => [q.id, q]));

    const finalAnswers = attempt.answers.map(ans => {
      let computedNormalizedValue = null;
      const q = qMap.get(ans.questionId);
      if (q && q.type === 'SLIDER' && ans.numericValue !== null && q.minValue !== null && q.maxValue !== null) {
        const val = (ans.numericValue - q.minValue) / (q.maxValue - q.minValue);
        computedNormalizedValue = Number(val.toFixed(4));
      }
      return { ...ans, computedNormalizedValue };
    });

    const submittedAt = new Date();
    
    // Build canonical JSON
    const payloadJsonObj = buildSurveyPayload({ ...attempt, submittedAt }, finalAnswers);
    const payloadJson = JSON.stringify(payloadJsonObj);

    const updatedAttempt = await this.prisma.surveyAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: submittedAt,
        payloadJson: payloadJson,
      },
    });

    // Run AI generation asynchronously to avoid blocking the submission response
    // Or we can await it if we want it immediately ready for results.
    // Waiting is better so /results doesn't return empty while it's processing.
    try {
      const aiFeedback = await this.aiService.generateFeedback(payloadJson);
      await this.prisma.surveyAttempt.update({
        where: { id: attempt.id },
        data: {
          aiFeedbackJson: JSON.stringify(aiFeedback),
        }
      });
    } catch (err) {
      console.error('Error in AI feedback generation flow', err);
    }

    return updatedAttempt;
  }

  async getResults(userId: string) {
    const attempt = await this.prisma.surveyAttempt.findFirst({
      where: {
        subjectUserId: userId,
        status: 'SUBMITTED',
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    if (!attempt) {
      throw new NotFoundException('No submitted attempt found for this user');
    }

    const results = await this.scoringService.computeResults(attempt.id);

    // Parse aiFeedback
    let aiFeedback = null;
    if (attempt.aiFeedbackJson) {
      try {
        aiFeedback = JSON.parse(attempt.aiFeedbackJson);
      } catch (e) {}
    }

    // Filter out sensitive data as per requirements
    // No isEligible, no failedGateIds
    return {
      overallScore: results.overallScore,
      range: results.range,
      description: this.getRangeDescription(results.range),
      dimensions: results.dimensions,
      aiFeedback,
    };
  }

  private getRangeDescription(range: 'EXPLORADOR' | 'USUARIO' | 'IMPULSOR' | 'EMBAJADOR' | null): string {
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
