// ─── User Types ───────────────────────────────────────────────────────────────
// Backend roles: 'user' | 'admin'  (no 'citizen'/'official' in DB)
export type UserRole = 'user' | 'admin' | 'citizen' | 'official';

export interface User {
  id: string;
  name: string;        // mapped from backend's `username`
  username?: string;   // raw backend field
  email: string;
  role: UserRole;
  avatar?: string;
  ward?: string;
  createdAt?: string;
  issuesReported?: number;
  issuesResolved?: number;
}

// ─── Backend Report (raw from PostgreSQL) ────────────────────────────────────
export interface BackendReport {
  id: string;                // UUID from PostgreSQL
  description: string;
  image_url: string | null;
  location: string;          // PostGIS serialised
  created_by: string;        // MongoDB user _id
  category: string;
  severity_score: number;
  priority_score: number;
  created_at: string;
  updated_at?: string;
  status?: string;           // 'pending' | 'open' | 'in_progress' | 'resolved' | 'closed'
  upvote_count?: number;
}

// ─── Issue Types ──────────────────────────────────────────────────────────────
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus   = 'pending' | 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssueCategory =
  | 'pothole' | 'crack' | 'waterlogging'
  | 'broken_divider' | 'damaged_footpath' | 'other';

export interface Coordinates { lat: number; lng: number; }

export interface AIAnalysis {
  severity: SeverityLevel;
  severityScore: number;          // 0–100
  priorityScore: number;          // 0–100
  confidence: number;             // 0–1
  damageType: string;
  estimatedArea: number;          // sq. meters
  repairEstimate: string;
  urgencyReason: string;
  detectedFeatures: string[];
  boundingBoxes?: BoundingBox[];
}

export interface BoundingBox {
  x: number; y: number;
  width: number; height: number;
  label: string; confidence: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: SeverityLevel;
  priorityScore: number;
  location: {
    address: string;
    city: string;
    ward?: string;
    coordinates: Coordinates;
  };
  images: string[];
  aiAnalysis: AIAnalysis;
  reportedBy: { id: string; name: string; };
  assignedTo?: string;
  upvotes: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  role: UserRole;
  createdAt: string;
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export interface Feedback {
  id: string;
  reportId: string;
  message: string;
  sentBy: string;
  sentAt: string;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalIssues: number;
  openIssues: number;
  resolvedThisMonth: number;
  criticalPending: number;
  avgResolutionDays: number;
  citizensEngaged: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ─── API Types ────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IssueFilters {
  status?: IssueStatus;
  severity?: SeverityLevel;
  category?: IssueCategory;
  ward?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'priorityScore' | 'createdAt' | 'updatedAt' | 'upvotes';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
