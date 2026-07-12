import React from 'react';
import {
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardBody, Badge } from '../../components/ui';
import { formatDateTime } from '../../utils';

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: string; positive: boolean };
  color: 'brand' | 'success' | 'warning' | 'danger' | 'info';
}

const colorMap = {
  brand:   { bg: 'bg-brand-muted',              icon: 'text-brand' },
  success: { bg: 'bg-status-success-bg',         icon: 'text-status-success' },
  warning: { bg: 'bg-status-warning-bg',         icon: 'text-status-warning' },
  danger:  { bg: 'bg-status-danger-bg',          icon: 'text-status-danger' },
  info:    { bg: 'bg-status-info-bg',            icon: 'text-status-info' },
};

function StatCard({ label, value, icon: Icon, trend, color }: StatCardProps): React.JSX.Element {
  const colors = colorMap[color];
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.positive ? 'text-status-success' : 'text-status-danger'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value} vs last month
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} className={colors.icon} />
        </div>
      </div>
    </Card>
  );
}

// ─── Recent Activity Item ─────────────────────────────────────────────────────

interface ActivityItemProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ icon: Icon, iconColor, title, description, time }: ActivityItemProps): React.JSX.Element {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
        <Icon size={13} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary mt-0.5 truncate">{description}</p>
      </div>
      <p className="text-xs text-text-muted flex-shrink-0">{time}</p>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage(): React.JSX.Element {
  const { user } = useAuth();

  // Phase 2: These values will come from API calls
  const stats = [
    { label: 'Total Vehicles', value: 0, icon: Truck, color: 'brand' as const },
    { label: 'Active Drivers', value: 0, icon: Users, color: 'success' as const },
    { label: 'Trips Today', value: 0, icon: Route, color: 'info' as const },
    { label: 'Pending Maintenance', value: 0, icon: Wrench, color: 'warning' as const },
    { label: 'Fuel Usage (L)', value: 0, icon: Fuel, color: 'danger' as const },
    { label: 'Fleet Efficiency', value: '—', icon: TrendingUp, color: 'success' as const },
  ];

  return (
    <div className="animate-fade-in">
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {getGreeting()},{' '}
            {user?.firstName}
          </h1>
          <p className="page-subtitle">
            {formatDateTime(new Date())} · Fleet Operations Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>
            Systems Operational
          </Badge>
        </div>
      </div>

      {/* ─── Alert Banner (placeholder for real alerts in Phase 2) ─── */}
      <div className="flex items-center gap-2 p-3 mb-5 bg-status-warning-bg border border-yellow-200 rounded text-sm text-status-warning">
        <AlertTriangle size={15} className="flex-shrink-0" />
        <span>
          <strong>Setup required:</strong> No data yet. Complete Phase 2 to connect your fleet data.
        </span>
      </div>

      {/* ─── KPI Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* ─── Content Grid ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader
              title="Recent Activity"
              subtitle="Latest operations across your fleet"
            />
            <CardBody>
              <ActivityItem
                icon={CheckCircle2}
                iconColor="bg-status-success"
                title="System initialized"
                description="TransitOps Phase 1 foundation is operational"
                time="Just now"
              />
              <ActivityItem
                icon={Clock}
                iconColor="bg-status-info"
                title="Awaiting fleet data"
                description="Vehicle, driver and trip modules will be connected in Phase 2"
                time="Pending"
              />
              <div className="py-8 text-center text-sm text-text-muted">
                <Route size={24} className="mx-auto mb-2 text-border" />
                Fleet activity will appear here once data is connected.
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Fleet Status Summary */}
        <div>
          <Card>
            <CardHeader title="Fleet Status" subtitle="Vehicle availability" />
            <CardBody>
              <div className="space-y-3">
                {[
                  { label: 'Active',      value: '—', variant: 'success' as const },
                  { label: 'Idle',        value: '—', variant: 'warning' as const },
                  { label: 'Maintenance', value: '—', variant: 'danger' as const },
                  { label: 'Offline',     value: '—', variant: 'neutral' as const },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <Badge variant={item.variant} dot>
                      {item.label}
                    </Badge>
                    <span className="text-sm font-semibold text-text-primary">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border text-center text-xs text-text-muted">
                Connect fleet module in Phase 2
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
