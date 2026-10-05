import api from './api';

export interface AnswerDetail {
  questionText: string;
  answerText: string;
  isGate: boolean;
  category?: string;
  dimension?: string;
  scoreValue?: string;
}

export interface CandidateMetric {
  id: string;
  fullName: string;
  email: string;
  area: string;
  position: string;
  overallScore: number;
  eligibilityStatus: 'ELEGIBLE' | 'NO_ELEGIBLE' | 'NO_ELEGIBLE_POR_GATE';
  isGatePassed: boolean;
  gateQuestionText: string;
  gateAnswerText: string;
  categoryScores: { name: string; score: number }[];
  dimensionScores: { name: string; score: number }[];
  answers: AnswerDetail[];
}

export interface CandidatesResponse {
  candidates: CandidateMetric[];
  areas: string[];
  positions: string[];
}

export const candidatesService = {
  getCandidates: async (): Promise<CandidatesResponse> => {
    const token = localStorage.getItem('accessToken');
    const response = await api.get('/admin/candidates', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};
