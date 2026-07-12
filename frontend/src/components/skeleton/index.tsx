/**
 * Skeleton Design System — TransitOps Enterprise
 *
 * Single source for all skeleton UI primitives.
 * No external deps — pure Tailwind + CSS shimmer.
 * Fully memoized for performance.
 */

import React, { memo } from 'react';
import { cn } from '../../utils';

// ─── Primitive ────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** A single shimmering block. Compose these to build layouts. */
export const Sk = memo(function Sk({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      aria-hidden="true"
      style={style}
    />
  );
});

// ─── Text lines ───────────────────────────────────────────────────────────────

export const SkText = memo(function SkText({ className }: SkeletonProps) {
  return <Sk className={cn('h-3.5 w-full rounded', className)} />;
});

export const SkTitle = memo(function SkTitle({ className }: SkeletonProps) {
  return <Sk className={cn('h-5 w-2/3 rounded', className)} />;
});

export const SkSubtitle = memo(function SkSubtitle({ className }: SkeletonProps) {
  return <Sk className={cn('h-3 w-1/2 rounded', className)} />;
});

// ─── Badge / chip ─────────────────────────────────────────────────────────────

export const SkBadge = memo(function SkBadge({ className }: SkeletonProps) {
  return <Sk className={cn('h-5 w-16 rounded-full', className)} />;
});

// ─── Avatar circle ────────────────────────────────────────────────────────────

export const SkAvatar = memo(function SkAvatar({
  size = 'md',
  className,
}: SkeletonProps & { size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-7 h-7', md: 'w-8 h-8', lg: 'w-10 h-10' }[size];
  return <Sk className={cn('rounded-full flex-shrink-0', sz, className)} />;
});

// ─── Button ───────────────────────────────────────────────────────────────────

export const SkButton = memo(function SkButton({ className }: SkeletonProps) {
  return <Sk className={cn('h-8 w-28 rounded', className)} />;
});

// ─── Input ────────────────────────────────────────────────────────────────────

export const SkInput = memo(function SkInput({ className }: SkeletonProps) {
  return <Sk className={cn('h-9 w-full rounded', className)} />;
});

// ─── KPI stat card ────────────────────────────────────────────────────────────

export const SkStatCard = memo(function SkStatCard({ accent = false }: { accent?: boolean }) {
  return (
    <div
      className="bg-white border border-border rounded shadow-card p-4 space-y-2"
      aria-hidden="true"
      aria-busy="true"
    >
      <div className="flex justify-between items-start">
        <Sk className="h-2.5 w-20 rounded" />
        <Sk className="h-4 w-4 rounded" />
      </div>
      <Sk className="h-6 w-12 rounded mt-2" />
      <Sk className="h-2.5 w-24 rounded" />
    </div>
  );
});

// ─── Table skeleton ───────────────────────────────────────────────────────────

interface SkTableProps {
  rows?: number;
  cols?: number;
  hasActions?: boolean;
  hasBadge?: boolean;
}

export const SkTable = memo(function SkTable({
  rows = 8,
  cols = 5,
  hasActions = true,
  hasBadge = true,
}: SkTableProps) {
  return (
    <div aria-busy="true" aria-label="Loading table data">
      {/* Header */}
      <div className="bg-gray-50 border-b border-border px-6 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Sk key={i} className={cn('h-3 rounded', i === 0 ? 'w-28' : i === cols - 1 ? 'w-16 ml-auto' : 'w-20')} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-border bg-white">
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={ri} className="px-6 py-3.5 flex items-center gap-4">
            {/* Col 0: avatar + text */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SkAvatar size="sm" />
              <div className="space-y-1.5 flex-1">
                <Sk className="h-3.5 w-32 rounded" />
                <Sk className="h-2.5 w-44 rounded" />
              </div>
            </div>
            {/* Mid cols */}
            {Array.from({ length: cols - 2 }).map((_, ci) => (
              <Sk key={ci} className={cn('h-3.5 rounded', ci === 0 && hasBadge ? 'w-16' : 'w-24')} />
            ))}
            {/* Action col */}
            {hasActions && (
              <div className="flex gap-1.5 ml-auto">
                <Sk className="h-6 w-6 rounded" />
                <Sk className="h-6 w-6 rounded" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Chart placeholder ────────────────────────────────────────────────────────

interface SkChartProps {
  height?: number;
  type?: 'bar' | 'line' | 'pie' | 'area';
  className?: string;
}

export const SkChart = memo(function SkChart({
  height = 220,
  type = 'bar',
  className,
}: SkChartProps) {
  const bars = [60, 85, 50, 95, 70, 80, 55];

  if (type === 'pie') {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        style={{ height }}
        aria-hidden="true"
      >
        <Sk className="rounded-full" style={{ width: height * 0.65, height: height * 0.65 }} />
      </div>
    );
  }

  return (
    <div
      className={cn('flex items-end gap-2 px-4 pb-4 pt-2', className)}
      style={{ height }}
      aria-hidden="true"
    >
      {bars.map((h, i) => (
        <Sk
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${h}%`, opacity: 0.6 + i * 0.05 }}
        />
      ))}
    </div>
  );
});

// ─── Card wrapper ─────────────────────────────────────────────────────────────

export const SkCard = memo(function SkCard({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('bg-white border border-border rounded shadow-card', className)}
      aria-busy="true"
    >
      {children}
    </div>
  );
});

// ─── Filter bar skeleton ──────────────────────────────────────────────────────

export const SkFilterBar = memo(function SkFilterBar({ filters = 3 }: { filters?: number }) {
  return (
    <SkCard className="p-4">
      <div className="flex flex-wrap gap-3">
        <Sk className="h-9 w-64 rounded" />
        {Array.from({ length: filters }).map((_, i) => (
          <Sk key={i} className="h-9 w-36 rounded" />
        ))}
        <Sk className="h-9 w-28 rounded ml-auto" />
      </div>
    </SkCard>
  );
});

// ─── Page header skeleton ─────────────────────────────────────────────────────

export const SkPageHeader = memo(function SkPageHeader({ hasButton = true }: { hasButton?: boolean }) {
  return (
    <div className="flex items-center justify-between mb-6" aria-hidden="true">
      <div className="space-y-2">
        <Sk className="h-6 w-52 rounded" />
        <Sk className="h-3.5 w-80 rounded" />
      </div>
      {hasButton && <SkButton />}
    </div>
  );
});

// ─── Pagination skeleton ──────────────────────────────────────────────────────

export const SkPagination = memo(function SkPagination() {
  return (
    <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-gray-50" aria-hidden="true">
      <Sk className="h-3 w-40 rounded" />
      <div className="flex gap-1">
        <Sk className="h-7 w-7 rounded" />
        <Sk className="h-7 w-16 rounded" />
        <Sk className="h-7 w-7 rounded" />
      </div>
    </div>
  );
});

// ─── Detail drawer skeleton ───────────────────────────────────────────────────

export const SkDetails = memo(function SkDetails({ rows = 6 }: { rows?: number }) {
  return (
    <div className="p-6 space-y-5" aria-busy="true" aria-label="Loading details">
      {/* Avatar + name block */}
      <div className="flex items-center gap-4">
        <SkAvatar size="lg" />
        <div className="space-y-2 flex-1">
          <Sk className="h-4 w-36 rounded" />
          <SkBadge />
        </div>
      </div>
      {/* Detail rows */}
      <div className="space-y-4 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-2.5">
            <Sk className="h-4 w-4 rounded mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Sk className="h-2.5 w-16 rounded" />
              <Sk className={cn('h-3.5 rounded', i % 3 === 0 ? 'w-48' : i % 3 === 1 ? 'w-32' : 'w-56')} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Form skeleton ────────────────────────────────────────────────────────────

export const SkForm = memo(function SkForm({ fields = 6, cols = 2 }: { fields?: number; cols?: number }) {
  const rows = Math.ceil(fields / cols);
  return (
    <div className="p-6 space-y-4" aria-busy="true" aria-label="Loading form">
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className={cn('grid gap-4', cols === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
          {Array.from({ length: cols }).map((_, ci) => (
            <div key={ci} className="space-y-1.5">
              <Sk className="h-3 w-24 rounded" />
              <SkInput />
            </div>
          ))}
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-2">
        <SkButton />
        <SkButton />
      </div>
    </div>
  );
});

// ─── Dashboard KPI grid ───────────────────────────────────────────────────────

export const SkDashboardKPIs = memo(function SkDashboardKPIs({ count = 7 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkStatCard key={i} />
      ))}
    </div>
  );
});

// ─── Dashboard full skeleton ──────────────────────────────────────────────────

export const SkDashboard = memo(function SkDashboard() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-6 w-56 rounded" />
          <Sk className="h-3.5 w-80 rounded" />
        </div>
        <Sk className="h-9 w-64 rounded" />
      </div>

      {/* KPI Cards */}
      <SkDashboardKPIs count={7} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkCard className="col-span-2">
          <div className="px-5 py-4 border-b border-border">
            <Sk className="h-4 w-40 rounded" />
          </div>
          <SkChart height={240} type="line" />
        </SkCard>
        <SkCard>
          <div className="px-5 py-4 border-b border-border">
            <Sk className="h-4 w-32 rounded" />
          </div>
          <SkChart height={240} type="pie" />
        </SkCard>
      </div>

      {/* Second charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkCard>
          <div className="px-5 py-4 border-b border-border">
            <Sk className="h-4 w-40 rounded" />
          </div>
          <SkChart height={200} type="bar" />
        </SkCard>
        <SkCard>
          <div className="px-5 py-4 border-b border-border">
            <Sk className="h-4 w-40 rounded" />
          </div>
          <SkChart height={200} type="area" />
        </SkCard>
      </div>

      {/* Bottom tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkCard>
          <div className="px-5 py-4 border-b border-border">
            <Sk className="h-4 w-32 rounded" />
          </div>
          <SkTable rows={5} cols={4} hasActions={false} hasBadge={true} />
        </SkCard>
        <SkCard>
          <div className="px-5 py-4 border-b border-border">
            <Sk className="h-4 w-40 rounded" />
          </div>
          <SkTable rows={5} cols={4} hasActions={false} hasBadge={true} />
        </SkCard>
      </div>
    </div>
  );
});

// ─── Generic list page skeleton ───────────────────────────────────────────────
// Covers Vehicles, Drivers, Trips, Maintenance, Fuel, Expenses, Users

interface SkListPageProps {
  rows?: number;
  cols?: number;
  filters?: number;
  hasButton?: boolean;
}

export const SkListPage = memo(function SkListPage({
  rows = 10,
  cols = 5,
  filters = 3,
  hasButton = true,
}: SkListPageProps) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <SkPageHeader hasButton={hasButton} />
      <SkFilterBar filters={filters} />
      <SkCard>
        <SkTable rows={rows} cols={cols} />
        <SkPagination />
      </SkCard>
    </div>
  );
});

// ─── Reports page skeleton ────────────────────────────────────────────────────

export const SkReports = memo(function SkReports() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading reports">
      {/* Header + buttons */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-6 w-52 rounded" />
          <Sk className="h-3.5 w-80 rounded" />
        </div>
        <div className="flex gap-2">
          <SkButton />
          <SkButton />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border bg-white rounded-t px-4 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Sk key={i} className="h-8 w-24 rounded-t" />
        ))}
      </div>

      {/* Filter bar */}
      <SkFilterBar filters={3} />

      {/* Large report table */}
      <SkCard>
        <SkTable rows={12} cols={6} hasActions={false} hasBadge={true} />
      </SkCard>
    </div>
  );
});

// ─── Settings page skeleton ───────────────────────────────────────────────────

export const SkSettings = memo(function SkSettings() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading settings">
      <SkPageHeader hasButton={false} />

      {/* Tab nav */}
      <div className="flex gap-2 border-b border-border pb-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Sk key={i} className="h-8 w-24 rounded-t" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="lg:col-span-2 space-y-4">
          <SkCard className="p-6 space-y-5">
            <Sk className="h-4 w-40 rounded" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Sk className="h-3 w-24 rounded" />
                  <SkInput />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <SkButton />
            </div>
          </SkCard>

          <SkCard className="p-6 space-y-4">
            <Sk className="h-4 w-32 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="space-y-1">
                  <Sk className="h-3.5 w-36 rounded" />
                  <Sk className="h-2.5 w-52 rounded" />
                </div>
                <Sk className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </SkCard>
        </div>

        {/* Sidebar panel */}
        <div className="space-y-4">
          <SkCard className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <SkAvatar size="lg" />
              <div className="space-y-2">
                <Sk className="h-4 w-28 rounded" />
                <SkBadge />
              </div>
            </div>
            <Sk className="h-px w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Sk className="h-2.5 w-16 rounded" />
                <Sk className="h-3.5 w-32 rounded" />
              </div>
            ))}
          </SkCard>

          <SkCard className="p-5 space-y-3">
            <Sk className="h-4 w-24 rounded" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Sk className="h-3 w-20 rounded" />
                <SkInput />
              </div>
            ))}
            <SkButton className="w-full" />
          </SkCard>
        </div>
      </div>
    </div>
  );
});
