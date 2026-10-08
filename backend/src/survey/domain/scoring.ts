import { SurveyAnswerRecord, SurveyQuestionRecord } from './survey-models';
import {
  calculateWeightedScore,
  resolveRank,
  type ScoreRank,
} from '../../scoring/scoring';

export type DimensionScore = {
  dimension: string;
  score: number;
  questionCount: number;
};

export type DeterministicResult = {
  overallScore: number | null;
  range: ScoreRank | null;
  dimensions: DimensionScore[];
  internalEligibility: {
    isEligible: boolean;
    failedGateIds: string[];
  };
};

export function calculateSurveyResults(
  answers: SurveyAnswerRecord[],
  questions: SurveyQuestionRecord[],
): DeterministicResult {
  if (!answers.length) {
    return {
      overallScore: null,
      range: null,
      dimensions: [],
      internalEligibility: { isEligible: false, failedGateIds: [] },
    };
  }

  const questionMap = new Map(questions.map(question => [question.id, question]));
  let isEligible = true;
  const failedGateIds: string[] = [];
  let totalScoreSum = 0;
  let totalWeight = 0;
  const dimensionAgg: Record<string, { sumWeighted: number; sumWeight: number; count: number }> = {};

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question || !question.isActive || !question.scoreEligible) continue;

    const weight = answer.weightSnapshot || question.weight;
    if (weight <= 0) continue;

    if (question.isGate) {
      let passed = false;
      if (question.type === 'MULTIPLE_CHOICE') {
        passed = Boolean(question.options.find(option => option.id === answer.selectedOptionId)?.isPassing);
      } else if (
        question.type === 'SLIDER' &&
        answer.numericValue !== null &&
        question.passingValue !== null
      ) {
        passed = answer.numericValue >= question.passingValue;
      }

      if (!passed) {
        isEligible = false;
        failedGateIds.push(question.id);
      }
      continue;
    }

    let value: number | null = null;
    if (question.type === 'MULTIPLE_CHOICE') {
      if (answer.optionValueSnapshot !== null) {
        value = answer.optionValueSnapshot;
      } else {
        const selectedOption = question.options.find(option => option.id === answer.selectedOptionId);
        if (selectedOption) value = selectedOption.value;
      }
    } else if (
      question.type === 'SLIDER' &&
      answer.numericValue !== null &&
      question.minValue !== null &&
      question.maxValue !== null
    ) {
      value = (answer.numericValue - question.minValue) / (question.maxValue - question.minValue);
    }

    if (value === null) continue;
    totalScoreSum += value * weight;
    totalWeight += weight;

    const dimension = answer.dimensionSnapshot || question.dimension;
    if (dimension && dimension !== 'No aplica') {
      dimensionAgg[dimension] ??= { sumWeighted: 0, sumWeight: 0, count: 0 };
      dimensionAgg[dimension].sumWeighted += value * weight;
      dimensionAgg[dimension].sumWeight += weight;
      dimensionAgg[dimension].count += 1;
    }
  }

  const overallScore = calculateWeightedScore(totalScoreSum, totalWeight);
  const dimensions = Object.entries(dimensionAgg)
    .filter(([, aggregate]) => aggregate.sumWeight > 0)
    .map(([dimension, aggregate]) => ({
      dimension,
      score: calculateWeightedScore(aggregate.sumWeighted, aggregate.sumWeight) ?? 0,
      questionCount: aggregate.count,
    }));

  return {
    overallScore,
    range: overallScore === null ? null : resolveRank(overallScore),
    dimensions,
    internalEligibility: { isEligible, failedGateIds },
  };
}