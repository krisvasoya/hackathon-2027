import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import {
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  DollarSign,
  Info,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { Card, CardBody, Button, LoadingSpinner, Badge } from '../../components/ui';
import { formatDate } from '../../utils';

export default function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate();

  // Filters State
  const [preset, setPreset] = useState<'today' | '7days' | '30days' | 'custom'>('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch Stats Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard_stats', preset, startDate, endDate],
    queryFn: () =>
      dashboardService.getStats({
        preset,
        startDate: preset === 'custom' ? startDate : undefined,
        endDate: preset === 'custom' ? endDate : undefined,
      }),
  });

  const handleQuickAction = (route: string) => {
    navigate(route);
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'danger':
        return 'border-l-4 border-l-status-danger bg-status-danger-bg/25 text-status-danger-hover';
      case 'warning':
        return 'border-l-4 border-l-status-warning bg-status-warning-bg/25 text-status-warning-hover';
      case 'info':
        return 'border-l-4 border-l-status-info bg-status-info-bg/25 text-status-info-hover';
      default:
        return 'border-l-4 border-l-border bg-surface text-text-primary';
    }
  };

  // Pie chart COLORS
  const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626'];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-status-danger px-6">
        <AlertTriangle size={48} className="mb-3" />
        <h3 className="text-lg font-bold">Failed to load system dashboard</h3>
        <p className="text-sm text-text-secondary mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-title">Enterprise Command Center</h1>
          <p className="page-subtitle">Real-time telemetry, fleet availability index, and general ledger operational costs</p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded border border-border">
          {(['today', '7days', '30days', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                preset === p
                  ? 'bg-brand text-white'
                  : 'text-text-secondary hover:bg-surface'
              }`}
            >
              {p === '7days' ? 'Last 7 Days' : p === '30days' ? 'Last 30 Days' : p}
            </button>
          ))}

          {preset === 'custom' && (
            <div className="flex items-center gap-1.5 pl-3 border-l border-border ml-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 px-2 border border-border rounded text-2xs focus:ring-1 focus:ring-brand focus:outline-none bg-white"
              />
              <span className="text-2xs text-text-muted">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 px-2 border border-border rounded text-2xs focus:ring-1 focus:ring-brand focus:outline-none bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 bg-white border border-border rounded">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-text-secondary font-medium animate-pulse">
            Compiling ledger, vehicle statuses, and route telemetry...
          </p>
        </div>
      ) : (
        <>
          {/* ─── KPI Cards Grid (13 Items) ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
            {/* Total Vehicles */}
            <Card className="border-t-2 border-t-brand">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Vehicles</p>
                  <Truck size={14} className="text-brand" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.totalVehicles}</p>
                <div className="text-[10px] text-text-muted mt-1 flex gap-1">
                  <span>Avail: {data.kpis.availableVehicles}</span>
                </div>
              </CardBody>
            </Card>

            {/* Available Vehicles */}
            <Card className="border-t-2 border-t-status-success">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Vehicles Ready</p>
                  <Truck size={14} className="text-status-success" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.availableVehicles}</p>
                <p className="text-[10px] text-status-success mt-1">Ready for dispatch</p>
              </CardBody>
            </Card>

            {/* Vehicles On Trip */}
            <Card className="border-t-2 border-t-status-info">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Vehicles Active</p>
                  <Route size={14} className="text-status-info" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.vehiclesOnTrip}</p>
                <p className="text-[10px] text-status-info mt-1">Transit locked</p>
              </CardBody>
            </Card>

            {/* Vehicles In Maintenance */}
            <Card className="border-t-2 border-t-status-warning">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">In Workshop</p>
                  <Wrench size={14} className="text-status-warning" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.vehiclesInMaintenance}</p>
                <p className="text-[10px] text-status-warning mt-1">Repair locks active</p>
              </CardBody>
            </Card>

            {/* Total Drivers */}
            <Card className="border-t-2 border-t-brand">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Total Drivers</p>
                  <Users size={14} className="text-brand" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.totalDrivers}</p>
                <p className="text-[10px] text-text-muted mt-1">Avail: {data.kpis.availableDrivers}</p>
              </CardBody>
            </Card>

            {/* Available Drivers */}
            <Card className="border-t-2 border-t-status-success">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Drivers Ready</p>
                  <Users size={14} className="text-status-success" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.availableDrivers}</p>
                <p className="text-[10px] text-status-success mt-1">Ready for routes</p>
              </CardBody>
            </Card>

            {/* Active Trips */}
            <Card className="border-t-2 border-t-status-info">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Active Trips</p>
                  <Route size={14} className="text-status-info" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.activeTrips}</p>
                <p className="text-[10px] text-status-info mt-1">Active dispatches</p>
              </CardBody>
            </Card>

            {/* Completed Trips Today */}
            <Card className="border-t-2 border-t-status-success">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Done Today</p>
                  <Route size={14} className="text-status-success" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.completedTripsToday}</p>
                <p className="text-[10px] text-status-success mt-1">Arrived safely</p>
              </CardBody>
            </Card>

            {/* Fuel Cost Today */}
            <Card className="border-t-2 border-t-status-warning">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Fuel Cost Today</p>
                  <Fuel size={14} className="text-status-warning" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">${data.kpis.fuelCostToday.toLocaleString()}</p>
                <p className="text-[10px] text-text-muted mt-1">Daily refuel expenses</p>
              </CardBody>
            </Card>

            {/* Maintenance Cost This Month */}
            <Card className="border-t-2 border-t-status-danger">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Maint Cost MTD</p>
                  <Wrench size={14} className="text-status-danger" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">${data.kpis.maintenanceCostThisMonth.toLocaleString()}</p>
                <p className="text-[10px] text-text-muted mt-1">Monthly repair audits</p>
              </CardBody>
            </Card>

            {/* Total Operational Cost */}
            <Card className="border-t-2 border-t-brand col-span-2 md:col-span-1">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Total Ops Cost</p>
                  <DollarSign size={14} className="text-brand" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">${data.kpis.totalOperationalCost.toLocaleString()}</p>
                <p className="text-[10px] text-text-muted mt-1">For selected date range</p>
              </CardBody>
            </Card>

            {/* Fleet Utilization % */}
            <Card className="border-t-2 border-t-brand">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Fleet Util %</p>
                  <TrendingUp size={14} className="text-brand" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.fleetUtilization}%</p>
                <p className="text-[10px] text-text-muted mt-1">Active transit ratio</p>
              </CardBody>
            </Card>

            {/* Fleet Health Score */}
            <Card className="border-t-2 border-t-status-success">
              <CardBody className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-3xs font-bold text-text-secondary uppercase">Fleet Health</p>
                  <TrendingUp size={14} className="text-status-success" />
                </div>
                <p className="text-lg font-bold text-text-primary mt-1.5">{data.kpis.fleetHealth}%</p>
                <p className="text-[10px] text-status-success mt-1">Operational status rating</p>
              </CardBody>
            </Card>
          </div>

          {/* ─── Quick Actions Panel ─── */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Button
              variant="secondary"
              className="bg-white border-border hover:bg-surface text-xs justify-start px-4 h-12"
              leftIcon={<PlusCircle size={15} className="text-brand" />}
              onClick={() => handleQuickAction('/vehicles')}
            >
              Register Vehicle
            </Button>
            <Button
              variant="secondary"
              className="bg-white border-border hover:bg-surface text-xs justify-start px-4 h-12"
              leftIcon={<PlusCircle size={15} className="text-status-success" />}
              onClick={() => handleQuickAction('/drivers')}
            >
              Register Driver
            </Button>
            <Button
              variant="secondary"
              className="bg-white border-border hover:bg-surface text-xs justify-start px-4 h-12"
              leftIcon={<PlusCircle size={15} className="text-status-info" />}
              onClick={() => handleQuickAction('/trips')}
            >
              Create Trip
            </Button>
            <Button
              variant="secondary"
              className="bg-white border-border hover:bg-surface text-xs justify-start px-4 h-12"
              leftIcon={<Fuel size={15} className="text-status-warning" />}
              onClick={() => handleQuickAction('/fuel')}
            >
              Add Fuel Receipt
            </Button>
            <Button
              variant="secondary"
              className="bg-white border-border hover:bg-surface text-xs justify-start px-4 h-12"
              leftIcon={<Wrench size={15} className="text-status-danger" />}
              onClick={() => handleQuickAction('/maintenance')}
            >
              Schedule Service
            </Button>
            <Button
              variant="secondary"
              className="bg-white border-border hover:bg-surface text-xs justify-start px-4 h-12"
              leftIcon={<DollarSign size={15} className="text-brand" />}
              onClick={() => handleQuickAction('/expenses')}
            >
              Add Expense
            </Button>
          </div>

          {/* ─── Live Status Summaries ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardBody className="p-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2 mb-3">
                  Vehicle Status Index
                </h4>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-lg font-bold text-status-success">{data.kpis.availableVehicles}</p>
                    <p className="text-[10px] text-text-muted font-medium">AVAILABLE</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-status-info">{data.kpis.vehiclesOnTrip}</p>
                    <p className="text-[10px] text-text-muted font-medium">ON TRIP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-status-warning">{data.kpis.vehiclesInMaintenance}</p>
                    <p className="text-[10px] text-text-muted font-medium">IN SHOP</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2 mb-3">
                  Driver Operator Index
                </h4>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-lg font-bold text-status-success">{data.kpis.availableDrivers}</p>
                    <p className="text-[10px] text-text-muted font-medium">AVAILABLE</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-status-info">{data.kpis.vehiclesOnTrip}</p>
                    <p className="text-[10px] text-text-muted font-medium">ON TRIP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-text-muted">{data.kpis.totalDrivers - data.kpis.availableDrivers - data.kpis.vehiclesOnTrip}</p>
                    <p className="text-[10px] text-text-muted font-medium">OFF DUTY/SUSP</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border pb-2 mb-3">
                  Trip Route Index
                </h4>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-lg font-bold text-status-info">{data.kpis.activeTrips}</p>
                    <p className="text-[10px] text-text-muted font-medium">DISPATCHED</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-status-success">{data.kpis.completedTripsToday}</p>
                    <p className="text-[10px] text-text-muted font-medium">DONE TODAY</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* ─── Charts Section ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trips Per Day (Line Chart) */}
            <Card className="lg:col-span-2">
              <CardBody className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Trips Per Day</h3>
                  <Badge variant="info">Line Chart</Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.charts.tripsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
                      <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Vehicle Status Distribution (Pie Chart) */}
            <Card>
              <CardBody className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Vehicle Status Distribution</h3>
                  <Badge variant="neutral">Pie Chart</Badge>
                </div>
                <div className="h-64 relative flex items-center justify-center">
                  {data.charts.vehicleStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.charts.vehicleStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.charts.vehicleStatus.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-text-secondary">No vehicle data available</p>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Monthly Fuel Cost (Bar Chart) */}
            <Card>
              <CardBody className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Monthly Fuel Cost ($)</h3>
                  <Badge variant="warning">Bar Chart</Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.monthlyCosts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="fuel" fill="#d97706" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Monthly Maintenance Cost (Bar Chart) */}
            <Card>
              <CardBody className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Monthly Maintenance Cost ($)</h3>
                  <Badge variant="danger">Bar Chart</Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.monthlyCosts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="maintenance" fill="#dc2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Fleet Utilization Trend (Area Chart) */}
            <Card>
              <CardBody className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Fleet Utilization Trend (%)</h3>
                  <Badge variant="info">Area Chart</Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.charts.utilizationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip />
                      <defs>
                        <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="rate" stroke="#2563eb" fillOpacity={1} fill="url(#utilGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            {/* Revenue vs Operational Cost (Line Chart) */}
            <Card className="lg:col-span-3">
              <CardBody className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Revenue vs Operational Cost</h3>
                  <Badge variant="neutral">Line Chart</Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.charts.revenueVsCosts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="revenue" name="Total Revenue" stroke="#16a34a" strokeWidth={2} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="cost" name="Operational Cost" stroke="#dc2626" strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* ─── Alerts & Activities Grid Split ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alerts Panel */}
            <div className="space-y-4 lg:col-span-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">Active Warnings & Compliance</h3>
              <Card className="max-h-[500px] overflow-y-auto">
                <CardBody className="p-4 space-y-3">
                  {data.alerts.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center gap-1.5">
                      <ShieldCheck size={28} className="text-status-success" />
                      <p className="text-xs font-bold text-text-primary">All Systems Nominal</p>
                      <p className="text-3xs text-text-secondary">No active compliance or maintenance alarms triggered.</p>
                    </div>
                  ) : (
                    data.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded text-xs flex justify-between items-center transition-colors ${getAlertStyle(
                          alert.type
                        )}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Info size={14} className="mt-0.5 flex-shrink-0" />
                          <p className="font-medium leading-tight">{alert.message}</p>
                        </div>
                        <button
                          onClick={() => navigate(alert.link)}
                          className="p-1 hover:bg-black/10 rounded flex-shrink-0"
                          title="Navigate to module"
                        >
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Recent Activity Timeline */}
            <div className="space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-sans">Recent System Operations Audit</h3>
              <Card className="max-h-[500px] overflow-y-auto">
                <CardBody className="p-4">
                  {data.activity.length === 0 ? (
                    <p className="text-xs text-text-secondary text-center py-10">No recent activities registered.</p>
                  ) : (
                    <div className="relative border-l border-border pl-4 ml-2.5 space-y-6 py-2">
                      {data.activity.map((act) => (
                        <div key={act.id} className="relative">
                          {/* Dot marker */}
                          <span className="absolute -left-[21px] mt-1.5 w-2 h-2 rounded-full bg-brand border border-white" />
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="text-xs font-bold text-text-primary">
                                {act.action.replace(/_/g, ' ')}
                              </p>
                              <p className="text-3xs text-text-secondary mt-0.5 font-mono">
                                Resource: {act.resource} {act.resourceId ? `(${act.resourceId.substring(0, 8)})` : ''}
                              </p>
                              {act.user && (
                                <p className="text-3xs text-text-muted mt-0.5">
                                  Triggered by: {act.user.firstName} {act.user.lastName} ({act.user.email})
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-text-muted font-medium whitespace-nowrap">
                              {formatDate(act.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
