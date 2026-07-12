import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Download,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { vehicleService } from '../../services/vehicle.service';
import { driverService } from '../../services/driver.service';
import { tripService } from '../../services/trip.service';
import { fuelService } from '../../services/fuel.service';
import { maintenanceService } from '../../services/maintenance.service';
import { expenseService } from '../../services/expense.service';
import { dashboardService } from '../../services/dashboard.service';
import { auditService } from '../../services/audit.service';
import { Card, CardBody, Button, Badge } from '../../components/ui';
import { QUERY_KEYS } from '../../constants';
import { formatDate } from '../../utils';

type ReportTab =
  | 'vehicle'
  | 'driver'
  | 'trip'
  | 'fuel'
  | 'maintenance'
  | 'expense'
  | 'summary'
  | 'audit';

export default function ReportsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ReportTab>('vehicle');

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const sortBy = 'createdAt';
  const sortOrder = 'desc';

  // ─── Data Queries ───
  
  // 1. Vehicle Query
  const { data: vehicleData, isLoading: isVehicleLoading } = useQuery({
    queryKey: [QUERY_KEYS.VEHICLES, activeTab, search, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      vehicleService.getVehicles({
        page: 1,
        limit: 100,
        search: search || undefined,
        status: statusFilter as any || undefined,
        sortBy,
        sortOrder,
      }),
    enabled: activeTab === 'vehicle',
  });

  // 2. Driver Query
  const { data: driverData, isLoading: isDriverLoading } = useQuery({
    queryKey: [QUERY_KEYS.DRIVERS, activeTab, search, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      driverService.getDrivers({
        page: 1,
        limit: 100,
        search: search || undefined,
        status: statusFilter as any || undefined,
        sortBy,
        sortOrder,
      }),
    enabled: activeTab === 'driver',
  });

  // 3. Trip Query
  const { data: tripData, isLoading: isTripLoading } = useQuery({
    queryKey: [QUERY_KEYS.TRIPS, activeTab, search, statusFilter, startDate, endDate, sortBy, sortOrder],
    queryFn: () =>
      tripService.getTrips({
        page: 1,
        limit: 100,
        search: search || undefined,
        status: statusFilter as any || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      }),
    enabled: activeTab === 'trip',
  });

  // 4. Fuel Query
  const { data: fuelData, isLoading: isFuelLoading } = useQuery({
    queryKey: ['fuel_report', activeTab, search, startDate, endDate],
    queryFn: () =>
      fuelService.getFuelLogs({
        page: 1,
        limit: 100,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeTab === 'fuel',
  });

  // 5. Maintenance Query
  const { data: maintenanceData, isLoading: isMaintenanceLoading } = useQuery({
    queryKey: ['maintenance_report', activeTab, search, statusFilter, startDate, endDate],
    queryFn: () =>
      maintenanceService.getMaintenances({
        page: 1,
        limit: 100,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    enabled: activeTab === 'maintenance',
  });

  // 6. Expense Query
  const { data: expenseData, isLoading: isExpenseLoading } = useQuery({
    queryKey: ['expense_report', activeTab, search, statusFilter, startDate, endDate],
    queryFn: () =>
      expenseService.getExpenses({
        page: 1,
        limit: 100,
        search: search || undefined,
        expenseType: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeTab === 'expense',
  });

  // 7. Summary Query
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['summary_report', activeTab, startDate, endDate],
    queryFn: () =>
      dashboardService.getStats({
        preset: 'custom',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeTab === 'summary',
  });

  // 8. Audit Logs Query
  const { data: auditData, isLoading: isAuditLoading } = useQuery({
    queryKey: ['audit_logs_report', activeTab, search, statusFilter, startDate, endDate],
    queryFn: () =>
      auditService.getAuditLogs({
        page: 1,
        limit: 100,
        search: search || undefined,
        action: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: activeTab === 'audit',
  });

  // Reset page filters on tab switch
  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
    setSearch('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
  };

  // ─── Export Logic ───

  const exportReport = (format: 'CSV' | 'Excel') => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let reportName = `TransitOps_${activeTab}_Report`;

    if (activeTab === 'vehicle' && vehicleData) {
      headers = ['Asset Name', 'Model', 'Plate Number', 'Type', 'Year', 'Odometer', 'Region', 'Status'];
      rows = vehicleData.data.map(v => [
        v.vehicleName,
        v.vehicleModel,
        v.registrationNumber,
        v.vehicleType,
        v.manufacturingYear,
        v.currentOdometer,
        v.region,
        v.status,
      ]);
    } else if (activeTab === 'driver' && driverData) {
      headers = ['Full Name', 'Employee ID', 'License Number', 'Expiry Date', 'Phone', 'Safety Score', 'Status'];
      rows = driverData.data.map(d => [
        d.fullName,
        d.employeeId || '—',
        d.licenseNumber,
        formatDate(d.licenseExpiryDate),
        d.phoneNumber,
        d.safetyScore,
        d.status,
      ]);
    } else if (activeTab === 'trip' && tripData) {
      headers = ['Trip Number', 'Source', 'Destination', 'Cargo Weight (kg)', 'Revenue ($)', 'Status', 'Start Date'];
      rows = tripData.data.map(t => [
        t.tripNumber,
        t.source,
        t.destination,
        t.cargoWeight,
        Number(t.tripRevenue),
        t.status,
        t.tripStartTime ? formatDate(t.tripStartTime) : '—',
      ]);
    } else if (activeTab === 'fuel' && fuelData) {
      headers = ['Vehicle Plate', 'Fuel Station', 'Liters (L)', 'Price / Liter', 'Total Cost', 'Refuel Date'];
      rows = fuelData.data.map(f => [
        f.vehicle?.registrationNumber || '—',
        f.fuelStation,
        f.liters,
        Number(f.pricePerLiter),
        Number(f.totalCost),
        formatDate(f.date),
      ]);
    } else if (activeTab === 'maintenance' && maintenanceData) {
      headers = ['Ticket Number', 'Vehicle Plate', 'Type', 'Priority', 'Scheduled Date', 'Workshop', 'Actual Cost', 'Status'];
      rows = maintenanceData.data.map(m => [
        m.maintenanceNumber,
        m.vehicle?.registrationNumber || '—',
        m.maintenanceType,
        m.priority,
        formatDate(m.scheduledDate),
        m.workshopName,
        m.actualCost ? Number(m.actualCost) : '—',
        m.status,
      ]);
    } else if (activeTab === 'expense' && expenseData) {
      headers = ['Vehicle Plate', 'Type', 'Amount ($)', 'Description', 'Transaction Date'];
      rows = expenseData.data.map(e => [
        e.vehicle?.registrationNumber || '—',
        e.expenseType,
        Number(e.amount),
        e.description,
        formatDate(e.date),
      ]);
    } else if (activeTab === 'summary' && summaryData) {
      headers = ['Metric Key', 'Value'];
      rows = [
        ['Total Vehicles', summaryData.kpis.totalVehicles],
        ['Available Vehicles', summaryData.kpis.availableVehicles],
        ['Active Dispatches', summaryData.kpis.activeTrips],
        ['MTD Repairs Cost', `$${summaryData.kpis.maintenanceCostThisMonth.toLocaleString()}`],
        ['Total Operational Expense', `$${summaryData.kpis.totalOperationalCost.toLocaleString()}`],
        ['Fleet Utilization', `${summaryData.kpis.fleetUtilization}%`],
        ['Fleet Health Rating', `${summaryData.kpis.fleetHealth}%`],
      ];
    } else if (activeTab === 'audit' && auditData) {
      headers = ['Date', 'Action', 'Resource', 'Resource ID', 'Triggered By'];
      rows = auditData.data.map((a: any) => [
        formatDate(a.createdAt),
        a.action,
        a.resource,
        a.resourceId || '—',
        a.user ? `${a.user.firstName} ${a.user.lastName} (${a.user.email})` : 'System',
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName}.${format === 'CSV' ? 'csv' : 'csv'}`); // Excel reads CSV natively
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading =
    isVehicleLoading ||
    isDriverLoading ||
    isTripLoading ||
    isFuelLoading ||
    isMaintenanceLoading ||
    isExpenseLoading ||
    isSummaryLoading ||
    isAuditLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Reports & Audits</h1>
          <p className="page-subtitle">Configure parameters, filter fleet indices, and export spreadsheet audit records</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => exportReport('CSV')}
            leftIcon={<Download size={14} />}
            disabled={isLoading}
            className="bg-white border-border"
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => exportReport('Excel')}
            leftIcon={<FileSpreadsheet size={14} />}
            disabled={isLoading}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border bg-white rounded-t px-4 pt-2 gap-1 flex-wrap">
        {([
          { key: 'vehicle', label: 'Vehicle Report' },
          { key: 'driver', label: 'Driver Report' },
          { key: 'trip', label: 'Trip Report' },
          { key: 'fuel', label: 'Fuel Report' },
          { key: 'maintenance', label: 'Maintenance Report' },
          { key: 'expense', label: 'Expense Report' },
          { key: 'summary', label: 'Dashboard Summary' },
          { key: 'audit', label: 'Audit Activity Log' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-brand text-brand'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Box */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center gap-4 py-4 px-5">
          {activeTab !== 'summary' && (
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Search report entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          )}

          <SlidersHorizontal size={15} className="text-text-muted hidden md:block" />

          {/* Condition-based Status / Category filters */}
          {activeTab === 'vehicle' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-brand w-full md:w-40"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          )}

          {activeTab === 'driver' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-brand w-full md:w-40"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          )}

          {activeTab === 'trip' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-brand w-full md:w-40"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

          {activeTab === 'expense' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-brand w-full md:w-40"
            >
              <option value="">All Categories</option>
              <option value="Fuel">Fuel</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Toll">Toll</option>
              <option value="Parking">Parking</option>
              <option value="Insurance">Insurance</option>
              <option value="Repair">Repair</option>
              <option value="Other">Other</option>
            </select>
          )}

          {activeTab === 'audit' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-brand w-full md:w-40"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="VEHICLE_CREATE">Vehicle Create</option>
              <option value="DRIVER_CREATE">Driver Create</option>
              <option value="TRIP_CREATE">Trip Create</option>
              <option value="TRIP_DISPATCH">Trip Dispatch</option>
              <option value="TRIP_COMPLETE">Trip Complete</option>
              <option value="MAINTENANCE_SCHEDULE">Maint Schedule</option>
              <option value="MAINTENANCE_START">Maint Start</option>
              <option value="MAINTENANCE_COMPLETE">Maint Complete</option>
              <option value="FUEL_CREATE">Fuel Added</option>
              <option value="EXPENSE_CREATE">Expense Added</option>
            </select>
          )}

          {/* Date range filters for reports */}
          {(activeTab === 'trip' || activeTab === 'fuel' || activeTab === 'maintenance' || activeTab === 'expense' || activeTab === 'summary' || activeTab === 'audit') && (
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs text-text-secondary whitespace-nowrap">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 px-2.5 border border-border rounded bg-white text-sm focus:outline-none"
              />
              <span className="text-xs text-text-secondary whitespace-nowrap">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 px-2.5 border border-border rounded bg-white text-sm focus:outline-none"
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Reports Table Layout */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-4 animate-pulse">
            {/* Mock Table Header skeleton */}
            <div className="h-8 bg-surface rounded w-full mb-4" />
            {/* Mock Rows skeleton */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 items-center py-3 border-b border-border">
                <div className="h-4 bg-surface rounded w-1/4" />
                <div className="h-4 bg-surface rounded w-1/4" />
                <div className="h-4 bg-surface rounded w-1/6" />
                <div className="h-4 bg-surface rounded w-1/6" />
                <div className="h-4 bg-surface rounded w-1/12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'vehicle' && vehicleData && (
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                  <tr>
                    <th className="px-6 py-3">Asset Name</th>
                    <th className="px-6 py-3">Model</th>
                    <th className="px-6 py-3">Plate Number</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Odometer</th>
                    <th className="px-6 py-3">Region</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {vehicleData.data.map(v => (
                    <tr key={v.id} className="table-row-hover">
                      <td className="px-6 py-3.5 font-medium">{v.vehicleName}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{v.vehicleModel}</td>
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold text-brand">{v.registrationNumber}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{v.vehicleType}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{v.currentOdometer.toLocaleString()} km</td>
                      <td className="px-6 py-3.5 text-text-secondary">{v.region}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={v.status === 'AVAILABLE' ? 'success' : v.status === 'IN_SHOP' ? 'warning' : 'info'}>
                          {v.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'driver' && driverData && (
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                  <tr>
                    <th className="px-6 py-3">Full Name</th>
                    <th className="px-6 py-3">Employee ID</th>
                    <th className="px-6 py-3">License Number</th>
                    <th className="px-6 py-3">Expiry Date</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Safety Score</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {driverData.data.map(d => (
                    <tr key={d.id} className="table-row-hover">
                      <td className="px-6 py-3.5 font-medium">{d.fullName}</td>
                      <td className="px-6 py-3.5 text-text-secondary font-mono text-xs">{d.employeeId || '—'}</td>
                      <td className="px-6 py-3.5 text-text-secondary font-mono text-xs">{d.licenseNumber}</td>
                      <td className="px-6 py-3.5 text-text-secondary text-xs">{formatDate(d.licenseExpiryDate)}</td>
                      <td className="px-6 py-3.5 text-text-secondary text-xs">{d.phoneNumber}</td>
                      <td className="px-6 py-3.5 text-text-secondary font-semibold">{d.safetyScore}/100</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={d.status === 'AVAILABLE' ? 'success' : d.status === 'SUSPENDED' ? 'danger' : 'info'}>
                          {d.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'trip' && tripData && (
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                  <tr>
                    <th className="px-6 py-3">Trip Number</th>
                    <th className="px-6 py-3">Source</th>
                    <th className="px-6 py-3">Destination</th>
                    <th className="px-6 py-3">Cargo Weight</th>
                    <th className="px-6 py-3">Revenue</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Start Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {tripData.data.map(t => (
                    <tr key={t.id} className="table-row-hover">
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold text-brand">{t.tripNumber}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{t.source}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{t.destination}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{t.cargoWeight.toLocaleString()} kg</td>
                      <td className="px-6 py-3.5 font-semibold">${Number(t.tripRevenue).toLocaleString()}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'CANCELLED' ? 'danger' : 'info'}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary text-xs">{t.tripStartTime ? formatDate(t.tripStartTime) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'fuel' && fuelData && (
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                  <tr>
                    <th className="px-6 py-3">Vehicle</th>
                    <th className="px-6 py-3">Fuel Station</th>
                    <th className="px-6 py-3">Liters (L)</th>
                    <th className="px-6 py-3">Price / Liter</th>
                    <th className="px-6 py-3">Total Cost</th>
                    <th className="px-6 py-3">Refuel Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {fuelData.data.map(f => (
                    <tr key={f.id} className="table-row-hover">
                      <td className="px-6 py-3.5 font-medium">{f.vehicle?.vehicleName || '—'}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{f.fuelStation}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{f.liters} L</td>
                      <td className="px-6 py-3.5 text-text-secondary">${Number(f.pricePerLiter).toFixed(2)}</td>
                      <td className="px-6 py-3.5 font-semibold">${Number(f.totalCost).toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-text-secondary text-xs">{formatDate(f.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'maintenance' && maintenanceData && (
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                  <tr>
                    <th className="px-6 py-3">Ticket Number</th>
                    <th className="px-6 py-3">Vehicle</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Scheduled Date</th>
                    <th className="px-6 py-3">Workshop</th>
                    <th className="px-6 py-3">Actual Cost</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {maintenanceData.data.map(m => (
                    <tr key={m.id} className="table-row-hover">
                      <td className="px-6 py-3.5 font-mono text-xs font-semibold text-brand">{m.maintenanceNumber}</td>
                      <td className="px-6 py-3.5 font-medium">{m.vehicle?.vehicleName || '—'}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{m.maintenanceType}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={m.priority === 'Critical' ? 'danger' : m.priority === 'High' ? 'warning' : 'info'}>
                          {m.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-text-secondary text-xs">{formatDate(m.scheduledDate)}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{m.workshopName}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{m.actualCost ? `$${Number(m.actualCost).toLocaleString()}` : '—'}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={m.status === 'COMPLETED' ? 'success' : m.status === 'CANCELLED' ? 'danger' : 'info'}>
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'expense' && expenseData && (
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                  <tr>
                    <th className="px-6 py-3">Vehicle</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Transaction Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {expenseData.data.map(e => (
                    <tr key={e.id} className="table-row-hover">
                      <td className="px-6 py-3.5 font-medium">{e.vehicle?.vehicleName || '—'}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={e.expenseType === 'Fuel' ? 'info' : e.expenseType === 'Maintenance' ? 'warning' : 'neutral'}>
                          {e.expenseType}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 font-semibold">${Number(e.amount).toLocaleString()}</td>
                      <td className="px-6 py-3.5 text-text-secondary">{e.description}</td>
                      <td className="px-6 py-3.5 text-text-secondary text-xs">{formatDate(e.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'summary' && summaryData && (
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                  <tr>
                    <th className="px-6 py-3">Metric Key</th>
                    <th className="px-6 py-3">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white font-mono text-xs">
                  <tr className="table-row-hover">
                    <td className="px-6 py-3.5 font-bold">Total Vehicles In Fleet</td>
                    <td className="px-6 py-3.5 text-brand font-bold">{summaryData.kpis.totalVehicles}</td>
                  </tr>
                  <tr className="table-row-hover">
                    <td className="px-6 py-3.5 font-bold">Available Vehicles Index</td>
                    <td className="px-6 py-3.5 text-status-success font-bold">{summaryData.kpis.availableVehicles}</td>
                  </tr>
                  <tr className="table-row-hover">
                    <td className="px-6 py-3.5 font-bold">Active Transit Dispatches</td>
                    <td className="px-6 py-3.5 text-status-info font-bold">{summaryData.kpis.activeTrips}</td>
                  </tr>
                  <tr className="table-row-hover">
                    <td className="px-6 py-3.5 font-bold">MTD Scheduled Repairs Cost</td>
                    <td className="px-6 py-3.5 font-bold">${summaryData.kpis.maintenanceCostThisMonth.toLocaleString()}</td>
                  </tr>
                  <tr className="table-row-hover">
                    <td className="px-6 py-3.5 font-bold">Total Operational Expenses</td>
                    <td className="px-6 py-3.5 font-bold">${summaryData.kpis.totalOperationalCost.toLocaleString()}</td>
                  </tr>
                  <tr className="table-row-hover">
                    <td className="px-6 py-3.5 font-bold">Average Fleet Utilization</td>
                    <td className="px-6 py-3.5 text-brand font-bold">{summaryData.kpis.fleetUtilization}%</td>
                  </tr>
                  <tr className="table-row-hover">
                    <td className="px-6 py-3.5 font-bold">Fleet Health Score</td>
                    <td className="px-6 py-3.5 text-status-success font-bold">{summaryData.kpis.fleetHealth}%</td>
                  </tr>
                </tbody>
              </table>
            )}

            {activeTab === 'audit' && auditData && (
              <table className="w-full text-left text-sm text-text-primary">
                <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Resource</th>
                    <th className="px-6 py-3">Resource ID</th>
                    <th className="px-6 py-3">Triggered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {auditData.data.map((a: any) => (
                    <tr key={a.id} className="table-row-hover">
                      <td className="px-6 py-3.5 text-text-secondary text-xs">{formatDate(a.createdAt)}</td>
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-text-primary">{a.action.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-3.5 text-text-secondary font-mono text-xs">{a.resource}</td>
                      <td className="px-6 py-3.5 text-text-muted font-mono text-3xs">{a.resourceId || '—'}</td>
                      <td className="px-6 py-3.5 text-text-secondary text-xs">
                        {a.user ? `${a.user.firstName} ${a.user.lastName} (${a.user.email})` : 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
