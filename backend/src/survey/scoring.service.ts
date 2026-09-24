import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type DimensionScore = {
  dimension: string;
  score: number;
  questionCount: number;
};

export type DeterministicResult = {
  overallScore: number | null;
  range: 'EXPLORADOR' | 'USUARIO' | 'IMPULSOR' | 'EMBAJADOR' | null;
  dimensions: DimensionScore[];
  internalEligibility: {
    isEligible: boolean;
    failedGateIds: string[];
  };
};

@Injectable()
export class ScoringService {
  constructor(private prisma: PrismaService) {}

  async computeResults(attemptId: string): Promise<DeterministicResult> {
    const attempt = await this.prisma.surveyAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true
      }
    });

    if (!attempt || !attempt.answers.length) {
      return {
        overallScore: null,
        range: null,
        dimensions: [],
        internalEligibility: { isEligible: false, failedGateIds: [] }
      };
    }

    // Load active questions to check thresholds, ranges, and gate correctness
    const questions = await this.prisma.question.findMany({
      include: { options: true }
    });
    const questionMap = new Map(questions.map(q => [q.id, q]));

    let isEligible = true;
    const failedGateIds: string[] = [];
    
    let totalScoreSum = 0;
    let totalWeight = 0;

    const dimensionAgg: Record<string, { sumWeighted: number; sumWeight: number; count: number }> = {};

    for (const answer of attempt.answers) {
      const qConfig = questionMap.get(answer.questionId);
      if (!qConfig || !qConfig.isActive) continue; // Ignore inactive or deleted questions from calculation

      // Skip non-score eligible (in case we have any legacy)
      if (!qConfig.scoreEligible) continue;

      const weight = Number(answer.weightSnapshot || qConfig.weight);
      if (weight <= 0) continue; // Exclude zero weight from averaging

      // --- EVALUATE GATE ---
      if (qConfig.isGate) {
        let passed = false;
        if (qConfig.type === 'MULTIPLE_CHOICE') {
          // Check if selected option is passing
          const selectedOpt = qConfig.options.find(o => o.id === answer.selectedOptionId);
          if (selectedOpt && selectedOpt.isPassing) {
            passed = true;
          }
        } else if (qConfig.type === 'SLIDER') {
          if (answer.numericValue !== null && qConfig.passingValue !== null) {
            if (answer.numericValue >= qConfig.passingValue) {
              passed = true;
            }
          }
        }
        
        if (!passed) {
          isEligible = false;
          failedGateIds.push(qConfig.id);
        }
        
        // Gates do NOT participate in overall score or dimensions
        continue; 
      }

      // --- CALCULATE NORMALIZED VALUE ---
      let value: number | null = null;
      if (qConfig.type === 'MULTIPLE_CHOICE') {
        if (answer.optionValueSnapshot !== null) {
          value = Number(answer.optionValueSnapshot);
        } else {
          const selectedOpt = qConfig.options.find(o => o.id === answer.selectedOptionId);
          if (selectedOpt) value = Number(selectedOpt.value);
        }
      } else if (qConfig.type === 'SLIDER') {
        if (answer.numericValue !== null && qConfig.minValue !== null && qConfig.maxValue !== null) {
          value = (answer.numericValue - qConfig.minValue) / (qConfig.maxValue - qConfig.minValue);
        }
      }

      if (value === null) continue; // skip missing answers
      
      // Accumulate Global
      totalScoreSum += (value * weight);
      totalWeight += weight;

      // Accumulate Dimension
      const dim = answer.dimensionSnapshot || qConfig.dimension;
      if (dim && dim !== 'No aplica') {
        if (!dimensionAgg[dim]) {
          dimensionAgg[dim] = { sumWeighted: 0, sumWeight: 0, count: 0 };
        }
        dimensionAgg[dim].sumWeighted += (value * weight);
        dimensionAgg[dim].sumWeight += weight;
        dimensionAgg[dim].count += 1;
      }
    }

    let overallScore: number | null = null;
    let range: 'EXPLORADOR' | 'USUARIO' | 'IMPULSOR' | 'EMBAJADOR' | null = null;

    if (totalWeight > 0) {
      overallScore = Number(((totalScoreSum / totalWeight) * 100).toFixed(2));
      range = this.resolveRank(overallScore);
    }

    const dimensions: DimensionScore[] = [];
    for (const [dim, agg] of Object.entries(dimensionAgg)) {
      if (agg.sumWeight > 0) {
        dimensions.push({
          dimension: dim,
          score: Number(((agg.sumWeighted / agg.sumWeight) * 100).toFixed(2)),
          questionCount: agg.count
        });
      }
    }

    return {
      overallScore,
      range,
      dimensions,
      internalEligibility: {
        isEligible,
        failedGateIds
      }
    };
  }

  resolveRank(score: number): 'EXPLORADOR' | 'USUARIO' | 'IMPULSOR' | 'EMBAJADOR' {
    // 0 to 25: EXPLORADOR
    // 25.01 to 50: USUARIO
    // 50.01 to 75: IMPULSOR
    // 75.01 to 100: EMBAJADOR
    if (score <= 25) return 'EXPLORADOR';
    if (score <= 50) return 'USUARIO';
    if (score <= 75) return 'IMPULSOR';
    return 'EMBAJADOR';
  }
}
