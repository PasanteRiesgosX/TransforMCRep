import axios from 'axios';

const API_URL = 'http://localhost:3000/admin/questions';

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const questionsService = {
  async getAll() {
    const response = await axios.get(API_URL, { headers: getHeaders() });
    return response.data;
  },
  
  async create(data: any) {
    const response = await axios.post(API_URL, data, { headers: getHeaders() });
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await axios.patch(`${API_URL}/${id}`, data, { headers: getHeaders() });
    return response.data;
  },

  async remove(id: string) {
    const response = await axios.delete(`${API_URL}/${id}`, { headers: getHeaders() });
    return response.data;
  },
  
  async reorder(items: { id: string, orderIndex: number }[]) {
    const response = await axios.patch(`${API_URL}/reorder`, { items }, { headers: getHeaders() });
    return response.data;
  }
};
