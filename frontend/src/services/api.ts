import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Types ──
export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  area: string;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyCodePayload {
  email: string;
  code: string;
}

export interface ResendCodePayload {
  email: string;
}

export interface UserData {
  id: string;
  email: string;
  fullName: string;
  area: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterResponse {
  statusCode: number;
  message: string;
  user: UserData;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  email: string;
  expiresInMinutes: number;
}

export interface VerifyCodeResponse {
  statusCode: number;
  message: string;
  accessToken: string;
  user: UserData;
}

export interface ResendCodeResponse {
  statusCode: number;
  message: string;
  email: string;
  expiresInMinutes: number;
}

// ── API Functions ──

export async function registerUser(data: RegisterPayload): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', data);
  return response.data;
}

export async function loginUser(data: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
}

export async function verifyCode(data: VerifyCodePayload): Promise<VerifyCodeResponse> {
  const response = await api.post<VerifyCodeResponse>('/auth/verify-code', data);
  return response.data;
}

export async function resendCode(data: ResendCodePayload): Promise<ResendCodeResponse> {
  const response = await api.post<ResendCodeResponse>('/auth/resend-code', data);
  return response.data;
}

// ── Error helper ──
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message[0] : data.message;
    }
    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
    }
    return 'Ocurrió un error inesperado. Intenta nuevamente.';
  }
  return 'Ocurrió un error inesperado. Intenta nuevamente.';
}

export default api;
