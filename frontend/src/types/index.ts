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

// ─── Driver Types ─────────────────────────────────────────────────────────────

export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';

export interface Driver {
  id: string;
  fullName: string;
  employeeId: string | null;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  phoneNumber: string;
  email: string;
  safetyScore: number;
  yearsOfExperience: number;
  address: string;
  emergencyContact: string;
  status: DriverStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Trip Types ───────────────────────────────────────────────────────────────

export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface Trip {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  actualDistance: number | null;
  estimatedDuration: number;
  tripStartTime: string | null;
  tripEndTime: string | null;
  startOdometer: number | null;
  endOdometer: number | null;
  tripRevenue: string;
  remarks: string | null;
  status: TripStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  vehicle?: {
    id: string;
    registrationNumber: string;
    vehicleName: string;
    vehicleModel: string;
    vehicleType: string;
    maximumLoadCapacity: number;
  };
  driver?: {
    id: string;
    fullName: string;
    employeeId: string | null;
    licenseNumber: string;
    licenseCategory: string;
    licenseExpiryDate: string;
    phoneNumber: string;
    safetyScore: number;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ─── Maintenance, Fuel, & Expense Types ────────────────────────────────────────

export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Maintenance {
  id: string;
  maintenanceNumber: string;
  vehicleId: string;
  maintenanceType: string;
  description: string;
  priority: string;
  scheduledDate: string;
  completedDate: string | null;
  estimatedCost: string;
  actualCost: string | null;
  workshopName: string;
  technicianName: string;
  notes: string | null;
  status: MaintenanceStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  vehicle?: {
    id: string;
    registrationNumber: string;
    vehicleName: string;
    status: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  tripId: string | null;
  liters: number;
  pricePerLiter: number;
  totalCost: string;
  odometer: number;
  fuelStation: string;
  date: string;
  createdAt: string;
  updatedAt: string;

  vehicle?: {
    id: string;
    registrationNumber: string;
    vehicleName: string;
  };
  trip?: {
    id: string;
    tripNumber: string;
    source: string;
    destination: string;
  };
}

export interface Expense {
  id: string;
  vehicleId: string;
  tripId: string | null;
  expenseType: string;
  amount: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;

  vehicle?: {
    id: string;
    registrationNumber: string;
    vehicleName: string;
  };
  trip?: {
    id: string;
    tripNumber: string;
    source: string;
    destination: string;
  };
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
