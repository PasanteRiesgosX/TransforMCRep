import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function resolveRank(score: number) {
  if (score <= 25) return 'EXPLORADOR';
  if (score <= 50) return 'USUARIO';
  if (score <= 75) return 'IMPULSOR';
  return 'EMBAJADOR';
}

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const attempts = await this.prisma.surveyAttempt.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        answers: true,
      },
    });

    const subjectUserIds = [...new Set(attempts.map(a => a.subjectUserId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: subjectUserIds } },
    });
    const usersMap = new Map(users.map(u => [u.id, u]));

    const questionIds = [...new Set(attempts.flatMap(a => a.answers.map(ans => ans.questionId)))];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
    });
    const questionsMap = new Map(questions.map(q => [q.id, q]));

    const areasSet = new Set<string>();
    const positionsSet = new Set<string>();
    const categoriesSet = new Set<string>();
    const dimensionsSet = new Set<string>();

    const participants = attempts.map(attempt => {
      const user = usersMap.get(attempt.subjectUserId);
      if (!user) return null;
      
      if (user.area) areasSet.add(user.area);
      if (user.position) positionsSet.add(user.position);

      let totalWeightedValue = 0;
      let totalWeight = 0;

      const dimensionScoresMap = new Map<string, { weightedValue: number; weight: number }>();
      const categoryScoresMap = new Map<string, { weightedValue: number; weight: number }>();
      const categoryDimensionScoresMap = new Map<string, { weightedValue: number; weight: number }>();

      for (const answer of attempt.answers) {
        const question = questionsMap.get(answer.questionId);
        if (!question || question.isGate || !question.scoreEligible) {
          continue;
        }

        const weight = Number(answer.weightSnapshot ?? question.weight ?? 0);
        if (weight <= 0) continue;

        let value: number | null = null;
        if (answer.questionTypeSnapshot === 'MULTIPLE_CHOICE') {
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

        if (value === null) continue;

        totalWeightedValue += value * weight;
        totalWeight += weight;

        const dimension = answer.dimensionSnapshot || question.dimension;
        const category = question.rubricCategory;

        if (dimension && dimension !== 'No aplica') {
          const agg = dimensionScoresMap.get(dimension) || { weightedValue: 0, weight: 0 };
          agg.weightedValue += value * weight;
          agg.weight += weight;
          dimensionScoresMap.set(dimension, agg);
          dimensionsSet.add(dimension);
        }

        if (category) {
          const agg = categoryScoresMap.get(category) || { weightedValue: 0, weight: 0 };
          agg.weightedValue += value * weight;
          agg.weight += weight;
          categoryScoresMap.set(category, agg);
          categoriesSet.add(category);
        }

        if (category && dimension && dimension !== 'No aplica') {
          const key = `${category}|${dimension}`;
          const agg = categoryDimensionScoresMap.get(key) || { weightedValue: 0, weight: 0 };
          agg.weightedValue += value * weight;
          agg.weight += weight;
          categoryDimensionScoresMap.set(key, agg);
        }
      }

      const overallScore = totalWeight > 0 ? Number(((totalWeightedValue / totalWeight) * 100).toFixed(2)) : 0;
      const range = resolveRank(overallScore);

      const dimensions = Array.from(dimensionScoresMap.entries()).map(([dim, agg]) => ({
        dimension: dim,
        score: agg.weight > 0 ? Number(((agg.weightedValue / agg.weight) * 100).toFixed(2)) : 0
      }));

      const categoryScores = Array.from(categoryScoresMap.entries()).map(([cat, agg]) => ({
        category: cat,
        score: agg.weight > 0 ? Number(((agg.weightedValue / agg.weight) * 100).toFixed(2)) : 0
      }));

      const categoryDimensionScores = Array.from(categoryDimensionScoresMap.entries()).map(([key, agg]) => {
        const [cat, dim] = key.split('|');
        return {
          category: cat,
          dimension: dim,
          score: agg.weight > 0 ? Number(((agg.weightedValue / agg.weight) * 100).toFixed(2)) : 0
        };
      });

      return {
        userId: user.id,
        fullName: user.fullName,
        area: user.area,
        position: user.position,
        overallScore,
        range,
        dimensions,
        categoryScores,
        categoryDimensionScores
      };
    }).filter(Boolean);

    const totalUsers = await this.prisma.user.findMany();
    const totalUsersByArea: Record<string, number> = {};
    const totalUsersByPosition: Record<string, number> = {};

    totalUsers.forEach(u => {
      if (u.area) {
        totalUsersByArea[u.area] = (totalUsersByArea[u.area] || 0) + 1;
      }
      if (u.position) {
        totalUsersByPosition[u.position] = (totalUsersByPosition[u.position] || 0) + 1;
      }
    });

    const allUsersList = totalUsers.map(u => ({ area: u.area, position: u.position }));

    return {
      participants,
      areas: Array.from(areasSet),
      positions: Array.from(positionsSet),
      categories: Array.from(categoriesSet),
      dimensions: Array.from(dimensionsSet),
      totalUsersByArea,
      totalUsersByPosition,
      allUsersList,
    };
  }
}
