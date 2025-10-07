import axios, { AxiosResponse } from 'axios';
import { AuthResponse, User, Lead, Dialer, ApiResponse, LoginForm, LeadForm, LeadUpdateForm, LeadDispositionForm, LeadNotification } from './types';

// Base API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://crm.margav.energy/api' 
  : 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
  } else {
    localStorage.removeItem('authToken');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize token on app start
if (authToken) {
  api.defaults.headers.common['Authorization'] = `Token ${authToken}`;
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Token ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginForm): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/api-token-auth/', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/users/me/');
    return response.data;
  },

  logout: () => {
    setAuthToken(null);
  },
};

// Users API
export const usersAPI = {
  getUsers: async (): Promise<ApiResponse<User>> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/users/');
    return response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response: AxiosResponse<User> = await api.get(`/users/${id}/`);
    return response.data;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/users/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  changePasswordForUser: async (username: string, oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/users/change-password-for-user/', {
      username: username,
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

// Leads API
export const leadsAPI = {
  getLeads: async (params?: {
    status?: string;
    assigned_agent?: number;
    search?: string;
    ordering?: string;
  }): Promise<ApiResponse<Lead>> => {
    const response: AxiosResponse<ApiResponse<Lead>> = await api.get('/leads/', { params });
    return response.data;
  },

  getLead: async (id: number): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.get(`/leads/${id}/`);
    return response.data;
  },

  createLead: async (leadData: LeadForm): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.post('/leads/', leadData);
    return response.data;
  },

  updateLead: async (id: number, leadData: LeadUpdateForm): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.patch(`/leads/${id}/`, leadData);
    return response.data;
  },

  deleteLead: async (id: number): Promise<void> => {
    await api.delete(`/leads/${id}/`);
  },

  getMyLeads: async (): Promise<ApiResponse<Lead>> => {
    const response: AxiosResponse<ApiResponse<Lead>> = await api.get('/leads/my/');
    return response.data;
  },

  getColdCallLeads: async (): Promise<ApiResponse<Lead>> => {
    const response: AxiosResponse<ApiResponse<Lead>> = await api.get('/leads/cold-call/');
    return response.data;
  },

  updateLeadDisposition: async (id: number, disposition: LeadDispositionForm): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.post(`/leads/${id}/disposition/`, disposition);
    return response.data;
  },

  sendToKelly: async (id: number): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post(`/leads/${id}/send-to-kelly/`);
    return response.data;
  },

  qualifyLead: async (id: number, data: LeadUpdateForm): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.post(`/leads/${id}/qualify/`, data);
    return response.data;
  },

  completeAppointment: async (id: number, data: LeadUpdateForm): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.post(`/leads/${id}/complete-appointment/`, data);
    return response.data;
  },
};

// Dialer API
export const dialerAPI = {
  getDialerStatus: async (): Promise<Dialer> => {
    const response: AxiosResponse<Dialer> = await api.get('/dialer/');
    return response.data;
  },

  updateDialerStatus: async (isActive: boolean): Promise<Dialer> => {
    const response: AxiosResponse<Dialer> = await api.patch('/dialer/', { is_active: isActive });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (): Promise<ApiResponse<LeadNotification>> => {
    const response: AxiosResponse<ApiResponse<LeadNotification>> = await api.get('/notifications/');
    return response.data;
  },

  markNotificationRead: async (notificationId: number): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post(`/notifications/${notificationId}/mark-read/`);
    return response.data;
  },

  markAllNotificationsRead: async (): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.post('/notifications/mark-all-read/');
    return response.data;
  },
};

export default api;
