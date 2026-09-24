import api from './api';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: string;
  orderIndex: number;
  minValue?: number;
  maxValue?: number;
  stepValue?: number;
  minLabel?: string;
  maxLabel?: string;
  options: {
    id: string;
    text: string;
    orderIndex: number;
  }[];
}

export interface SurveyAttempt {
  id: string;
  status: string;
  currentPage: number;
  answers: {
    questionId: string;
    selectedOptionId?: string | null;
    numericValue?: number | null;
    textValue?: string | null;
  }[];
}

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const surveyService = {
  getQuestions: async (): Promise<SurveyQuestion[]> => {
    const response = await api.get('/survey/questions', { headers: getHeaders() });
    return response.data;
  },

  getActiveAttempt: async (): Promise<SurveyAttempt> => {
    const response = await api.get('/survey/attempts/current', { headers: getHeaders() });
    return response.data;
  },

  saveProgress: async (attemptId: string, progress: { currentPage?: number; answers: unknown[] }) => {
    const response = await api.post(`/survey/attempts/${attemptId}/progress`, progress, { headers: getHeaders() });
    return response.data;
  },

  submitAttempt: async (attemptId: string, finalAnswers?: unknown[]) => {
    const response = await api.post(`/survey/attempts/${attemptId}/submit`, finalAnswers || [], { headers: getHeaders() });
    return response.data;
  },
};
