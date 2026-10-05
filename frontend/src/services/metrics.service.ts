import api from './api';

export interface ParticipantMetric {
  userId: string;
  fullName: string;
  area: string;
  position: string;
  overallScore: number;
  range: string;
  dimensions: { dimension: string; score: number }[];
  categoryScores: { category: string; score: number }[];
  categoryDimensionScores: { category: string; dimension: string; score: number }[];
}

export interface MetricsResponse {
  participants: ParticipantMetric[];
  areas: string[];
  positions: string[];
  categories: string[];
  dimensions: string[];
  totalUsersByArea: Record<string, number>;
  totalUsersByPosition: Record<string, number>;
  allUsersList: { area: string; position: string }[];
}

export const metricsService = {
  getMetrics: async (): Promise<MetricsResponse> => {
    const token = localStorage.getItem('accessToken');
    const response = await api.get('/admin/metrics', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};
