import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCandidates() {
    // 1. Get all submitted attempts with user details and answers
    const attempts = await this.prisma.surveyAttempt.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        answers: true,
      },
      orderBy: { submittedAt: 'desc' }
    });

    const subjectUserIds = [...new Set(attempts.map(a => a.subjectUserId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: subjectUserIds } },
    });
    const usersMap = new Map(users.map(u => [u.id, u]));

    const questionIds = [...new Set(attempts.flatMap(a => a.answers.map(ans => ans.questionId)))];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true }
    });
    const questionsMap = new Map(questions.map(q => [q.id, q]));

    // Track processed users to avoid duplicates if they have multiple attempts
    const processedUsers = new Set<string>();
    const candidates = [];

    for (const attempt of attempts) {
      if (processedUsers.has(attempt.subjectUserId)) continue;
      processedUsers.add(attempt.subjectUserId);

      const user = usersMap.get(attempt.subjectUserId);
      if (!user) continue;

      let totalWeightedValue = 0;
      let totalWeight = 0;

      let isGatePassed = true; // Assume pass unless failed
      let gateQuestionText = '';
      let gateAnswerText = '';

      const dimensionScoresMap = new Map<string, { weightedValue: number; weight: number }>();
      const categoryScoresMap = new Map<string, { weightedValue: number; weight: number }>();

      const detailedAnswers = [];

      for (const answer of attempt.answers) {
        const question = questionsMap.get(answer.questionId);
        if (!question) continue;

        const weight = Number(answer.weightSnapshot ?? question.weight ?? 0);
        let value: number | null = null;
        let selectedOption = null;

        if (answer.questionTypeSnapshot === 'MULTIPLE_CHOICE') {
          if (answer.selectedOptionId) {
            selectedOption = question.options.find(o => o.id === answer.selectedOptionId);
          }
          if (answer.optionValueSnapshot !== null) {
            value = Number(answer.optionValueSnapshot);
          }
        } else if (
          answer.questionTypeSnapshot === 'SLIDER' &&
          answer.numericValue !== null &&
          question.minValue !== null &&
          question.maxValue !== null
        ) {
          value = (answer.numericValue - question.minValue) / (question.maxValue - question.minValue);
        }

        // Evaluate Gate
        if (question.isGate) {
          gateQuestionText = question.text;
          if (answer.questionTypeSnapshot === 'MULTIPLE_CHOICE') {
            gateAnswerText = selectedOption?.text || answer.optionTextSnapshot || 'Sin respuesta';
            if (selectedOption && !selectedOption.isPassing) {
              isGatePassed = false;
            }
          } else if (answer.questionTypeSnapshot === 'SLIDER') {
            gateAnswerText = answer.numericValue?.toString() || 'Sin respuesta';
            const passingValue = question.passingValue ?? question.minValue ?? 0;
            if ((answer.numericValue || 0) < passingValue) {
              isGatePassed = false;
            }
          }
        }

        // Add to detailed answers for modal
        detailedAnswers.push({
          questionText: question.text,
          answerText: answer.questionTypeSnapshot === 'MULTIPLE_CHOICE' 
            ? (selectedOption?.text || answer.optionTextSnapshot || 'Sin respuesta')
            : (answer.numericValue?.toString() || answer.textValue || 'Sin respuesta'),
          isGate: question.isGate,
          category: question.rubricCategory,
          dimension: question.dimension,
          scoreValue: value !== null ? (value * 100).toFixed(1) : null
        });

        if (question.isGate || !question.scoreEligible || weight <= 0 || value === null) {
          continue;
        }

        totalWeightedValue += value * weight;
        totalWeight += weight;

        const dimension = answer.dimensionSnapshot || question.dimension;
        const category = question.rubricCategory;

        if (dimension && dimension !== 'No aplica') {
          const agg = dimensionScoresMap.get(dimension) || { weightedValue: 0, weight: 0 };
          agg.weightedValue += value * weight;
          agg.weight += weight;
          dimensionScoresMap.set(dimension, agg);
        }

        if (category) {
          const agg = categoryScoresMap.get(category) || { weightedValue: 0, weight: 0 };
          agg.weightedValue += value * weight;
          agg.weight += weight;
          categoryScoresMap.set(category, agg);
        }
      }

      const overallScore = totalWeight > 0 ? Number(((totalWeightedValue / totalWeight) * 100).toFixed(2)) : 0;

      const categoryScores = Array.from(categoryScoresMap.entries()).map(([cat, agg]) => ({
        name: cat,
        score: agg.weight > 0 ? Number(((agg.weightedValue / agg.weight) * 100).toFixed(2)) : 0
      }));

      const dimensionScores = Array.from(dimensionScoresMap.entries()).map(([dim, agg]) => ({
        name: dim,
        score: agg.weight > 0 ? Number(((agg.weightedValue / agg.weight) * 100).toFixed(2)) : 0
      }));

      // Determine Status
      // Good score threshold: e.g. > 50. Let's say >= 60 is eligible. Or simply > 50
      const hasGoodScore = overallScore >= 50; 
      let eligibilityStatus = 'NO_ELEGIBLE';

      if (hasGoodScore && isGatePassed) eligibilityStatus = 'ELEGIBLE';
      if (!hasGoodScore && !isGatePassed) eligibilityStatus = 'NO_ELEGIBLE';
      if (!hasGoodScore && isGatePassed) eligibilityStatus = 'NO_ELEGIBLE'; // bad score, passes gate
      if (hasGoodScore && !isGatePassed) eligibilityStatus = 'NO_ELEGIBLE_POR_GATE'; // good score, fails gate

      candidates.push({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        area: user.area,
        position: user.position,
        overallScore,
        eligibilityStatus,
        isGatePassed,
        gateQuestionText,
        gateAnswerText,
        categoryScores,
        dimensionScores,
        answers: detailedAnswers
      });
    }

    // Get areas and positions for filters
    const allUsersList = await this.prisma.user.findMany({ select: { area: true, position: true } });
    const areas = [...new Set(allUsersList.map(u => u.area).filter(Boolean))];
    const positions = [...new Set(allUsersList.map(u => u.position).filter(Boolean))];

    return { candidates, areas, positions };
  }
}
