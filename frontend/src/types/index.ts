// ─── User Types ───────────────────────────────────────────────────────────────

export type UserRole = 'citizen' | 'admin' | 'official';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  ward?: string;
  createdAt: string;
  issuesReported: number;
  issuesResolved: number;
}

// ─── Issue Types ──────────────────────────────────────────────────────────────

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssueCategory = 'pothole' | 'crack' | 'waterlogging' | 'broken_divider' | 'damaged_footpath' | 'other';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AIAnalysis {
  severity: SeverityLevel;
  severityScore: number;        // 0-100
  priorityScore: number;        // 0-100
  confidence: number;           // 0-1
  damageType: string;
  estimatedArea: number;        // in sq. meters
  repairEstimate: string;       // e.g. "₹15,000 - ₹25,000"
  urgencyReason: string;
  detectedFeatures: string[];
  boundingBoxes?: BoundingBox[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
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
    ward: string;
    city: string;
    coordinates: Coordinates;
  };
  images: string[];
  aiAnalysis: AIAnalysis;
  reportedBy: {
    id: string;
    name: string;
  };
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
