
import axios from 'axios';
import type { User, CoreMetrics, Warning, ForecastResult, WeeklyReport, FarmData, SlaughterData, MarketData } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function login(username: string, password: string, role: string): Promise<ApiResponse<{ user: User; token: string }>> {
  const res = await api.post('/auth/login', { username, password, role });
  return res.data;
}

export async function getNationalMetrics(date?: string): Promise<ApiResponse<CoreMetrics[]>> {
  const res = await api.get('/metrics/national', { params: { date } });
  return res.data;
}

export async function getFarmData(params?: { province?: string; city?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<FarmData[]>> {
  const res = await api.get('/data/farms', { params });
  return res.data;
}

export async function getSlaughterData(params?: { province?: string; city?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<SlaughterData[]>> {
  const res = await api.get('/data/slaughterhouses', { params });
  return res.data;
}

export async function getMarketData(params?: { province?: string; city?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<MarketData[]>> {
  const res = await api.get('/data/markets', { params });
  return res.data;
}

export async function getWarnings(params?: { province?: string; status?: string }): Promise<ApiResponse<Warning[]>> {
  const res = await api.get('/warnings', { params });
  return res.data;
}

export async function approveWarningStep(id: string, params: { step: number; role: string; operatorId: string; comment: string }): Promise<ApiResponse<boolean>> {
  const res = await api.post(`/warnings/${id}/approve`, params);
  return res.data;
}

export async function getForecast(province?: string): Promise<ApiResponse<ForecastResult>> {
  const res = await api.get('/forecast', { params: { province } });
  return res.data;
}

export async function generateForecast(province?: string): Promise<ApiResponse<ForecastResult>> {
  const res = await api.post('/forecast/generate', { province });
  return res.data;
}

export async function getWeeklyReports(province?: string): Promise<ApiResponse<WeeklyReport[]>> {
  const res = await api.get('/reports/weekly', { params: { province } });
  return res.data;
}

export async function uploadExcel(file: FormData): Promise<ApiResponse<any>> {
  const res = await api.post('/upload/excel', file, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

export async function getAllUsers(): Promise<ApiResponse<User[]>> {
  const res = await api.get('/users');
  return res.data;
}

export async function getFeedPrices(province?: string): Promise<ApiResponse<any>> {
  const res = await api.get('/feed-prices', { params: { province } });
  return res.data;
}

export async function checkWarnings(): Promise<ApiResponse<any>> {
  const res = await api.post('/warnings/check');
  return res.data;
}

export default api;
