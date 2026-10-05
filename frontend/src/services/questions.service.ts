import api from './api';

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const questionsService = {
  async getAll() {
    const response = await api.get('/admin/questions', { headers: getHeaders() });
    return response.data;
  },
  
  async create(data: any) {
    const response = await api.post('/admin/questions', data, { headers: getHeaders() });
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/admin/questions/${id}`, data, { headers: getHeaders() });
    return response.data;
  },

  async remove(id: string) {
    const response = await api.delete(`/admin/questions/${id}`, { headers: getHeaders() });
    return response.data;
  },
  
  async reorder(items: { id: string, orderIndex: number }[]) {
    const response = await api.patch('/admin/questions/reorder', { items }, { headers: getHeaders() });
    return response.data;
  }
};
