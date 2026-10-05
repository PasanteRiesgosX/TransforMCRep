import axios from 'axios';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!configuredApiBaseUrl) {
  throw new Error('Missing required frontend environment variable: VITE_API_BASE_URL');
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;