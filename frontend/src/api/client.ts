import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute =
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register');
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export function formatCents(cents: number | undefined | null): string {
  if (cents === undefined || cents === null || isNaN(cents)) return '$0.00';
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getApiErrorMessage(error: any): string {
  if (error.response?.data?.message) {
    const details = error.response.data.details;
    if (Array.isArray(details) && details.length > 0) {
      const detailMsgs = details.map((d: any) => d.message).join('; ');
      return `${error.response.data.message}: ${detailMsgs}`;
    }
    return error.response.data.message;
  }
  return error.message || 'An unexpected error occurred';
}

