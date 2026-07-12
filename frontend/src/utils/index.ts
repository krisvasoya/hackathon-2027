import type { UserRole } from '../types';
import { formatINR } from './currency';

// ─── Role Permissions ─────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN:       100,
  FLEET_MANAGER:     80,
  SAFETY_OFFICER:    60,
  FINANCIAL_ANALYST: 60,
  DISPATCHER:        40,
  DRIVER:            20,
  VIEWER:            10,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function hasAnyRole(userRole: UserRole, roles: UserRole[]): boolean {
  return roles.includes(userRole);
}

export * from './date';
export * from './time';

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Number Formatting ────────────────────────────────────────────────────────

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

export function formatCurrency(value: number | string | null | undefined): string {
  return formatINR(value);
}

export * from './currency';

// ─── String Utils ─────────────────────────────────────────────────────────────

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = (firstName ?? '').charAt(0);
  const l = (lastName ?? '').charAt(0);
  return `${f}${l}`.toUpperCase() || '?';
}

export function truncate(text: string, length = 40): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

// ─── Class Merging ────────────────────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
