import axios from 'axios';
import type { 
  ApiResponse, PaginatedResponse, Issue, IssueFilters, 
  DashboardStats, User, AIAnalysis 
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

const aiApi = axios.create({
  baseURL: '/ai',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor (attach JWT) ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor (handle 401) ────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cs_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string; phone: string; ward: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data),

  me: () => api.get<ApiResponse<User>>('/auth/me'),

  logout: () => api.post('/auth/logout'),
};

// ─── Issues ───────────────────────────────────────────────────────────────────
export const issuesAPI = {
  getAll: (filters?: IssueFilters) =>
    api.get<ApiResponse<PaginatedResponse<Issue>>>('/issues', { params: filters }),

  getById: (id: string) =>
    api.get<ApiResponse<Issue>>(`/issues/${id}`),

  create: (data: FormData) =>
    api.post<ApiResponse<Issue>>('/issues', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: Partial<Issue>) =>
    api.patch<ApiResponse<Issue>>(`/issues/${id}`, data),

  delete: (id: string) =>
    api.delete(`/issues/${id}`),

  upvote: (id: string) =>
    api.post<ApiResponse<{ upvotes: number }>>(`/issues/${id}/upvote`),

  addComment: (id: string, text: string) =>
    api.post<ApiResponse<Issue>>(`/issues/${id}/comments`, { text }),

  getNearby: (lat: number, lng: number, radius = 2) =>
    api.get<ApiResponse<Issue[]>>('/issues/nearby', { params: { lat, lng, radius } }),
};

// ─── AI Analysis ──────────────────────────────────────────────────────────────
export const aiAPI = {
  analyze: (imageData: FormData) =>
    aiApi.post<ApiResponse<AIAnalysis>>('/analyze', imageData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  reanalyze: (issueId: string) =>
    aiApi.post<ApiResponse<AIAnalysis>>(`/reanalyze/${issueId}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),

  getActivityChart: (days = 30) =>
    api.get('/dashboard/activity', { params: { days } }),

  getSeverityDistribution: () =>
    api.get('/dashboard/severity-distribution'),

  getWardHeatmap: () =>
    api.get('/dashboard/ward-heatmap'),

  getPriorityQueue: () =>
    api.get<ApiResponse<Issue[]>>('/dashboard/priority-queue'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getUsers: () => api.get<ApiResponse<User[]>>('/admin/users'),
  assignIssue: (issueId: string, officialId: string) =>
    api.patch(`/admin/issues/${issueId}/assign`, { officialId }),
  updateStatus: (issueId: string, status: string) =>
    api.patch(`/admin/issues/${issueId}/status`, { status }),
  exportReport: (filters?: IssueFilters) =>
    api.get('/admin/export', { params: filters, responseType: 'blob' }),
};

export default api;
