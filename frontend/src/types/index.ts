// ─── User & Auth Types ────────────────────────────────────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'FLEET_MANAGER'
  | 'SAFETY_OFFICER'
  | 'FINANCIAL_ANALYST'
  | 'DISPATCHER'
  | 'DRIVER'
  | 'VIEWER';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'PENDING_VERIFICATION';

export interface User {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  department: string | null;
  phone: string | null;
  avatarUrl: string | null;
  lastLoginAt: string | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: FieldError[];
  timestamp: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// ─── Vehicle Types ────────────────────────────────────────────────────────────

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleName: string;
  vehicleModel: string;
  vehicleType: string;
  manufacturer: string;
  manufacturingYear: number;
  maximumLoadCapacity: number;
  currentOdometer: number;
  acquisitionCost: number;
  purchaseDate: string;
  insuranceExpiry: string;
  registrationExpiry: string;
  status: VehicleStatus;
  region: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── UI Component Base Types ──────────────────────────────────────────────────

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = StatusVariant;

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
  children?: NavItem[];
}
