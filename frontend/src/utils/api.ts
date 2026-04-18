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
// Only redirect to /login from protected pages, never from auth routes themselves
// (avoids an infinite loop when /auth/me returns 401 on the login page)
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
        // Only redirect if not already on a public page
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

// ─── Reports (backend: GET/POST /reports) ────────────────────────────────────
export const reportsAPI = {
  /** GET /reports — returns top 10 by priority_score */
  getAll: () => api.get<BackendReport[]>('/reports'),

  /**
   * POST /reports — multipart/form-data
   * Fields: description (text), lat (text), lng (text)
   * File:   image (single image file, field name "image")
   */
  create: (data: {
    image_url: string;
    aiResult: object;
    description: string;
    lat: number;
    lng: number;
    categoryByUser: string;
  }) => api.post('/reports', data),

  /** DELETE /reports/:id  (needs backend endpoint) */
  delete: (id: string | number) => api.delete(`/reports/${id}`),

  /** PATCH /reports/:id/status  (needs backend endpoint) */
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

// ─── AI service (port 5001) ───────────────────────────────────────────────────
export const aiAPI = {
  /**
   * POST /analyze — Send image FormData to AI micro-service.
   * The AI service returns analysis result (damage_type, severity_score, etc.)
   */
  analyze: (imageData: FormData) =>
    api.post<AIAnalysis | any>('/ai/analyze', imageData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
};

// ─── Admin (/admin) ───────────────────────────────────────────────────────────
export const adminAPI = {
  /** GET /admin — Welcome message (confirms admin access) */
  ping: () => api.get('/admin'),

  /**
   * POST /admin/create-admin
   * Promotes an existing user (by email) to admin role.
   */
  promoteToAdmin: (email: string) =>
    api.post('/admin/create-admin', { email }),

  /**
   * Register a brand-new user via public signup endpoint.
   * Then optionally promote with promoteToAdmin.
   */
  createUser: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/signup', data),

  // ── The following routes don't exist yet in the backend ──────────────────
  // They are wired up in the UI; if the backend adds them later they'll work.

  getUsers: () =>
    api.get<ApiResponse<User[]>>('/admin/users'),

  deleteReport: (id: string | number) => api.delete(`/reports/${id}`),

  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),

  updateReportStatus: (id: string | number, status: string) =>
    api.patch(`/reports/${id}/status`, { status }),

  /** POST /admin/reports/:id/feedback — send feedback email to reporter */
  sendFeedback: (reportId: string | number, message: string) =>
    api.post(`/admin/reports/${reportId}/feedback`, { message }),
};

// ─── Disputes (/reports/:id/dispute) ─────────────────────────────────────────
export const disputeAPI = {
  /** POST /reports/:id/dispute — file a dispute on a resolved/closed report */
  file: (reportId: string, reason: string, comment?: string) =>
    api.post(`/reports/${reportId}/dispute`, { reason, comment }),

  /** GET /reports/:id/disputes — admin fetch all disputes for a report */
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
