import axios, { AxiosResponse } from 'axios';
import { AuthResponse, User, Lead, Dialer, ApiResponse, LoginForm, LeadForm, LeadUpdateForm, LeadDispositionForm, LeadNotification, Callback, CallbackForm } from './types';

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
    const response: AxiosResponse<AuthResponse> = await api.post('api-token-auth/', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<User> = await api.get('/users/me/');
    return response.data;
  },

  logout: () => {
    setAuthToken(null);
  },

  // Offline authentication support
  verifyToken: async (): Promise<{ valid: boolean; user: User }> => {
    const response: AxiosResponse<{ valid: boolean; user: User }> = await api.get('/auth/verify/');
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/refresh/');
    return response.data;
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
    page_size?: number;
    page?: string;
    all?: boolean | string;
  }): Promise<ApiResponse<Lead>> => {
    const response: AxiosResponse<ApiResponse<Lead>> = await api.get('/leads/', { params });
    return response.data;
  },

  getLead: async (id: number): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.get(`/leads/${id}/`);
    return response.data;
  },

  createLead: async (leadData: LeadForm): Promise<Lead> => {
    try {
      // Log request data for debugging (especially in production)
      console.log('Creating lead with data:', JSON.stringify(leadData, null, 2));
      const response: AxiosResponse<Lead> = await api.post('/leads/', leadData);
      return response.data;
    } catch (error: any) {
      // Log full error for debugging
      console.error('Create lead error:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      }
      throw error;
    }
  },

  updateLead: async (id: number, leadData: LeadForm): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.patch(`/leads/${id}/`, leadData);
    return response.data;
  },

  deleteLead: async (id: number): Promise<void> => {
    await api.delete(`/leads/${id}/`);
  },

  getMyLeads: async (params?: {
    page_size?: number;
    page?: string;
  }): Promise<ApiResponse<Lead>> => {
    const response: AxiosResponse<ApiResponse<Lead>> = await api.get('/leads/my/', { params });
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

  qualifyLead: async (id: number, data: LeadUpdateForm): Promise<{ lead: Lead; notification: any; calendar_synced: boolean }> => {
    const response: AxiosResponse<{ lead: Lead; notification: any; calendar_synced: boolean }> = await api.post(`/leads/${id}/qualify/`, data);
    return response.data;
  },

  completeAppointment: async (id: number, data: LeadUpdateForm): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.post(`/leads/${id}/complete-appointment/`, data);
    return response.data;
  },

  bulkDeleteLeadsForever: async (leadIds: number[]): Promise<{ message: string; deleted_count: number }> => {
    const response: AxiosResponse<{ message: string; deleted_count: number }> = await api.post('/leads/bulk-delete-forever/', { lead_ids: leadIds });
    return response.data;
  },

  sendAppointmentEmail: async (leadId: number, appointmentDate: string, appointmentTime?: string, notes?: string): Promise<{ message: string; lead_name: string; email: string; appointment_date: string; appointment_time?: string }> => {
    const response: AxiosResponse<{ message: string; lead_name: string; email: string; appointment_date: string; appointment_time?: string }> = await api.post('/leads/send-appointment-email/', {
      lead_id: leadId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      notes: notes
    });
    return response.data;
  },

  sendAppointmentReminder: async (leadId: number, appointmentDate: string, appointmentTime?: string): Promise<{ message: string; lead_name: string; email: string; appointment_date: string; appointment_time?: string }> => {
    const response: AxiosResponse<{ message: string; lead_name: string; email: string; appointment_date: string; appointment_time?: string }> = await api.post('/leads/send-appointment-reminder/', {
      lead_id: leadId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime
    });
    return response.data;
  },

  getNextLead: async (): Promise<Lead> => {
    const response: AxiosResponse<Lead> = await api.get('/leads/next/');
    return response.data;
  },

  markCallResult: async (leadId: number, notes?: string): Promise<{ message: string; lead: Lead }> => {
    const response: AxiosResponse<{ message: string; lead: Lead }> = await api.post('/calls/result/', {
      lead_id: leadId,
      notes: notes || ''
    });
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

  deleteNotification: async (notificationId: number): Promise<{ message: string }> => {
    const response: AxiosResponse<{ message: string }> = await api.delete(`/notifications/${notificationId}/delete/`);
    return response.data;
  },
};

// Callbacks API
export const callbacksAPI = {
  getCallbacks: async (): Promise<Callback[]> => {
    try {
      const response: AxiosResponse<Callback[]> = await api.get('/callbacks/');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  createCallback: async (callbackData: CallbackForm): Promise<Callback> => {
    try {
      const response: AxiosResponse<Callback> = await api.post('/callbacks/create/', callbackData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateCallback: async (callbackId: number, callbackData: Partial<Callback>): Promise<Callback> => {
    const response: AxiosResponse<Callback> = await api.patch(`/callbacks/${callbackId}/update/`, callbackData);
    return response.data;
  },

  getDueCallbacks: async (): Promise<Callback[]> => {
    const response: AxiosResponse<Callback[]> = await api.get('/callbacks/due-reminders/');
    return response.data;
  },
};

// Field Submissions API
export const fieldSubmissionsAPI = {
  getFieldSubmissions: async (): Promise<any[]> => {
    try {
      const response: AxiosResponse<any> = await api.get('/field-submissions/');
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    } catch (error: any) {
      throw error;
    }
  },

  getFieldSubmission: async (id: number): Promise<any> => {
    const response: AxiosResponse<any> = await api.get(`/field-submissions/${id}/`);
    return response.data;
  },

  createFieldSubmission: async (submissionData: any): Promise<any> => {
    const response: AxiosResponse<any> = await api.post('/field-submissions/', submissionData);
    return response.data;
  },

  updateFieldSubmission: async (id: number, submissionData: any): Promise<any> => {
    const response: AxiosResponse<any> = await api.patch(`/field-submissions/${id}/`, submissionData);
    return response.data;
  },

  deleteFieldSubmission: async (id: number): Promise<void> => {
    await api.delete(`/field-submissions/${id}/`);
  },
};

// AI Lead Assistant API
export interface AILeadAssistantResponse {
  lead_fields: {
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address1?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    campaign_id?: string | null;
    session_info?: string | null;
    notes?: string | null;
  };
  call_summary: string;
  lead_score: number;
  recommended_followup: string | null;
}

export const aiAPI = {
  processLeadText: async (rawText: string): Promise<AILeadAssistantResponse> => {
    try {
      const response: AxiosResponse<AILeadAssistantResponse> = await api.post('/ai/lead-assistant/', {
        raw_text: rawText,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  llamaChat: async (messages: Array<{role: string; content: string}>, temperature?: number, max_tokens?: number, json_mode?: boolean): Promise<{content: any; text: string}> => {
    try {
      // Use AI Dashboard API for Llama
      const aiDashboardToken = localStorage.getItem('aiDashboardToken');
      const apiInstance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          ...(aiDashboardToken && { 'Authorization': `Token ${aiDashboardToken}` }),
        },
      });
      
      const response: AxiosResponse<{content: any; text: string}> = await apiInstance.post('/ai-dashboard/chat/', {
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 2000,
        json_mode: json_mode || false,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};


export default api;
