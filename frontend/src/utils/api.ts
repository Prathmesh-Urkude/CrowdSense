import axios from 'axios';
import type { 
  ApiResponse, PaginatedResponse, Issue, IssueFilters, 
  DashboardStats, User, AIAnalysis 
} from '../types';

const api = axios.create({
  baseURL: 'http://localhost:5000/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // important for cookie-based auth
});

const aiApi = axios.create({
  baseURL: 'http://localhost:5001/', // separate AI service
  headers: { 'Content-Type': 'application/json' },
});

// ─── Response Interceptor (handle 401) ────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ user: User }>>('/auth/login', { email, password }),

  register: (data: { username: string; email: string; password: string;}) =>
    api.post<ApiResponse<{ user: User }>>('/auth/signup', data),

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
