import axios from 'axios';
import type {
  ApiResponse, BackendReport, User, AIAnalysis,
} from '../types';

// ─── Axios Instances ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:5000/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // httpOnly cookie auth
});

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthRoute = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(original);
      } catch {
        const pub = ['/', '/login', '/register', '/issues'];
        const onPublic = pub.some(p => window.location.pathname.startsWith(p));
        if (!onPublic) window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/signup', data),

  me: () => api.get<ApiResponse<User>>('/auth/me'),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post('/auth/refresh'),

  googleRedirect: () => {
    window.location.href = `${api.defaults.baseURL}auth/google`;
  },
};

// ─── Reports (/reports) ───────────────────────────────────────────────────────
export const reportsAPI = {
  /** GET /reports — top 20 by priority_score (status = reported | under-review) */
  getAll: () => api.get<BackendReport[]>('/reports'),

  /** GET /reports/:reportId */
  getById: (id: string) =>
    api.get<{ report: BackendReport; user?: any } | BackendReport>(`/reports/${id}`),

  /** GET /reports/user — current user's reports */
  getUserReports: () => api.get<BackendReport[]>('/reports/user'),

  /** POST /reports */
  create: (data: {
    image_url: string;
    aiResult: object;
    description: string;
    lat: number;
    lng: number;
    categoryByUser: string;
    file_fingerprint?: string;
  }) => api.post('/reports', data),

  /** POST /reports/user/:reportId/feedback */
  submitFeedback: (reportId: string, rating: number, comment: string) =>
    api.post(`/reports/user/${reportId}/feedback`, { rating, comment }),

  /** GET /reports/check-duplicate?fp=xxx — returns { duplicate, report? } */
  checkDuplicate: (fp: string) =>
    api.get<{ duplicate: boolean; report?: BackendReport }>('/reports/check-duplicate', { params: { fp } }),

  /** DELETE /reports/:id */
  delete: (id: string | number) => api.delete(`/reports/${id}`),

  /** PATCH /reports/:id/status */
  updateStatus: (id: string | number, status: string) =>
    api.patch(`/reports/${id}/status`, { status }),
};

// ─── Upvotes (/upvote/:reportId) ─────────────────────────────────────────────
export const upvoteAPI = {
  /** Toggle upvote — POST /upvote/:reportId */
  toggle: (reportId: string | number) => api.post(`/upvote/${reportId}`),

  /** Get count — GET /upvote/:reportId/count */
  getCount: (reportId: string | number) =>
    api.get<{ count: number }>(`/upvote/${reportId}/count`),

  /** Check if current user upvoted — GET /upvote/:reportId/status */
  getStatus: (reportId: string | number) =>
    api.get<{ upvoted: boolean }>(`/upvote/${reportId}/status`),
};

// ─── AI service ───────────────────────────────────────────────────────────────
export const aiAPI = {
  analyze: (imageData: FormData) =>
    api.post<AIAnalysis | any>('/ai/analyze', imageData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
};

// ─── Admin (/admin) ───────────────────────────────────────────────────────────
export const adminAPI = {
  ping: () => api.get('/admin'),

  promoteToAdmin: (email: string) =>
    api.post('/admin/create-admin', { email }),

  createUser: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/signup', data),

  getUsers: () =>
    api.get<ApiResponse<User[]>>('/admin/users'),

  /** GET /admin/reports — all reports, no status filter */
  getAllReports: () => api.get<BackendReport[]>('/admin/reports'),

  /** DELETE /admin/report/:id */
  deleteReport: (id: string) => api.delete(`/admin/report/${id}`),

  /** DELETE /admin/delete-user/:id */
  deleteUser: (userId: string) => api.delete(`/admin/delete-user/${userId}`),

  /** PATCH /admin/report/:id/status */
  updateReportStatus: (id: string | number, status: string, remark?: string) =>
    api.patch(`/admin/report/${id}/status`, { status, remark }),

  /** POST /admin/report/:id/feedback — send feedback email to reporter */
  sendFeedback: (reportId: string | number, message: string) =>
    api.post(`/admin/report/${reportId}/feedback`, { message }),
};

// ─── Disputes (/reports/:id/dispute) ─────────────────────────────────────────
export const disputeAPI = {
  file: (reportId: string, reason: string, comment?: string) =>
    api.post(`/reports/${reportId}/dispute`, { reason, comment }),

  getForReport: (reportId: string) =>
    api.get(`/reports/${reportId}/disputes`),
};

// ─── Dashboard helpers ────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivityChart: (days = 30) => api.get('/dashboard/activity', { params: { days } }),
  getSeverityDistribution: () => api.get('/dashboard/severity-distribution'),
  getPriorityQueue: () => api.get('/dashboard/priority-queue'),
};

export default api;
