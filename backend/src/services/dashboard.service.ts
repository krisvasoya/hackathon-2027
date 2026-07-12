import { prisma } from '../database/client';
import { VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus } from '@prisma/client';

export interface DashboardStatsParams {
  startDate?: string;
  endDate?: string;
  preset?: 'today' | '7days' | '30days' | 'custom';
}

export class DashboardService {
  async getDashboardData(params: DashboardStatsParams) {
    const { start, end } = this.getDateRange(params);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Run queries in parallel to optimize DB load
    const [
      vehicleCounts,
      driverCounts,
      tripCounts,
      completedTripsToday,
      todayFuelSum,
      monthMaintenanceSum,
      totalExpensesSum,
      recentAuditLogs,
      expiredLicensesCount,
      overdueMaintenanceCount,
      retiredVehiclesCount
    ] = await Promise.all([
      // 1. Vehicles by status
      prisma.vehicle.groupBy({
        by: ['status'],
        _count: true,
      }),
      // 2. Drivers by status
      prisma.driver.groupBy({
        by: ['status'],
        _count: true,
      }),
      // 3. Trips count
      prisma.trip.count({
        where: { status: TripStatus.DISPATCHED },
      }),
      // 4. Completed trips today
      prisma.trip.count({
        where: {
          status: TripStatus.COMPLETED,
          tripEndTime: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      // 5. Fuel cost today
      prisma.fuelLog.aggregate({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        _sum: { totalCost: true },
      }),
      // 6. Maintenance cost this month
      prisma.maintenance.aggregate({
        where: {
          status: MaintenanceStatus.COMPLETED,
          completedDate: {
            gte: monthStart,
          },
        },
        _sum: { actualCost: true },
      }),
      // 7. Total Operational cost for selected date range
      prisma.expense.aggregate({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        _sum: { amount: true },
      }),
      // 8. Recent operational activities
      prisma.auditLog.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      // 9. Alert - Expired licenses count
      prisma.driver.count({
        where: {
          licenseExpiryDate: {
            lt: new Date(),
          },
        },
      }),
      // 10. Alert - Overdue maintenance count
      prisma.maintenance.count({
        where: {
          status: MaintenanceStatus.PENDING,
          scheduledDate: {
            lt: new Date(),
          },
        },
      }),
      // 11. Retired vehicles
      prisma.vehicle.count({
        where: { status: VehicleStatus.RETIRED },
      }),
    ]);

    // Parse counts
    const totalVehicles = vehicleCounts.reduce((acc: number, c: any) => acc + c._count, 0);
    const availableVehicles = vehicleCounts.find((c: any) => c.status === VehicleStatus.AVAILABLE)?._count || 0;
    const vehiclesOnTrip = vehicleCounts.find((c: any) => c.status === VehicleStatus.ON_TRIP)?._count || 0;
    const vehiclesInMaintenance = vehicleCounts.find((c: any) => c.status === VehicleStatus.IN_SHOP)?._count || 0;

    const totalDrivers = driverCounts.reduce((acc: number, c: any) => acc + c._count, 0);
    const availableDrivers = driverCounts.find((c: any) => c.status === DriverStatus.AVAILABLE)?._count || 0;

    // Fleet utilization %: Vehicles currently on trip divided by total vehicles
    const fleetUtilization = totalVehicles > 0 ? parseFloat(((vehiclesOnTrip / totalVehicles) * 100).toFixed(1)) : 0;

    // Fleet health score: % of vehicles NOT in maintenance
    const fleetHealth = totalVehicles > 0 ? parseFloat((((totalVehicles - vehiclesInMaintenance) / totalVehicles) * 100).toFixed(1)) : 100;

    // Retrieve chart metrics in parallel
    const [tripsChartData, monthlyCostsChartData, utilizationTrendData, revenueVsCostsData] = await Promise.all([
      this.getTripsChartData(start, end),
      this.getMonthlyCostsChartData(),
      this.getUtilizationTrendData(start, end),
      this.getRevenueVsCostsData(start, end),
    ]);

    // Format alerts
    const alerts = [];
    if (expiredLicensesCount > 0) {
      alerts.push({
        id: 'expired-driver-licenses',
        type: 'warning',
        message: `${expiredLicensesCount} Driver License(s) expired or expiring immediately.`,
        link: '/drivers',
      });
    }
    if (vehiclesInMaintenance > 0) {
      alerts.push({
        id: 'vehicles-in-maintenance',
        type: 'info',
        message: `${vehiclesInMaintenance} Vehicle(s) currently locked in shop under active maintenance.`,
        link: '/maintenance',
      });
    }
    if (overdueMaintenanceCount > 0) {
      alerts.push({
        id: 'overdue-maintenance',
        type: 'danger',
        message: `${overdueMaintenanceCount} Maintenance ticket(s) are overdue for service.`,
        link: '/maintenance',
      });
    }
    if (totalVehicles > 0 && availableVehicles / totalVehicles < 0.2) {
      alerts.push({
        id: 'low-fleet-availability',
        type: 'warning',
        message: 'Low Fleet Availability: Less than 20% of fleet vehicles are ready for dispatch.',
        link: '/vehicles',
      });
    }
    if (todayFuelSum._sum.totalCost && Number(todayFuelSum._sum.totalCost) > 5000) {
      alerts.push({
        id: 'high-fuel-spending',
        type: 'warning',
        message: `High Fuel Spending Alert: Total fuel spend today has exceeded $5,000.`,
        link: '/fuel',
      });
    }
    if (retiredVehiclesCount > 0) {
      alerts.push({
        id: 'retired-vehicles',
        type: 'neutral',
        message: `${retiredVehiclesCount} Vehicle asset(s) are retired and decommissioned from operations.`,
        link: '/vehicles',
      });
    }

    return {
      kpis: {
        totalVehicles,
        availableVehicles,
        vehiclesOnTrip,
        vehiclesInMaintenance,
        totalDrivers,
        availableDrivers,
        activeTrips: tripCounts,
        completedTripsToday,
        fuelCostToday: Number(todayFuelSum._sum.totalCost || 0),
        maintenanceCostThisMonth: Number(monthMaintenanceSum._sum.actualCost || 0),
        totalOperationalCost: Number(totalExpensesSum._sum.amount || 0),
        fleetUtilization,
        fleetHealth,
      },
      charts: {
        tripsPerDay: tripsChartData,
        monthlyCosts: monthlyCostsChartData,
        utilizationTrend: utilizationTrendData,
        revenueVsCosts: revenueVsCostsData,
        vehicleStatus: vehicleCounts.map((c: any) => ({ name: c.status, value: c._count })),
      },
      alerts,
      activity: recentAuditLogs,
    };
  }

  private getDateRange(params: DashboardStatsParams) {
    const end = params.endDate ? new Date(params.endDate) : new Date();
    let start: Date;

    if (params.preset === 'today') {
      start = new Date();
      start.setHours(0, 0, 0, 0);
    } else if (params.preset === '7days') {
      start = new Date();
      start.setDate(start.getDate() - 7);
    } else if (params.preset === '30days') {
      start = new Date();
      start.setDate(start.getDate() - 30);
    } else if (params.startDate) {
      start = new Date(params.startDate);
    } else {
      // Default to last 30 days
      start = new Date();
      start.setDate(start.getDate() - 30);
    }

    return { start, end };
  }

  // 1. Trips Per Day (Line Chart)
  private async getTripsChartData(start: Date, end: Date) {
    const trips = await prisma.trip.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const countsMap: Record<string, number> = {};
    trips.forEach((t: any) => {
      const day = t.createdAt.toISOString().split('T')[0];
      countsMap[day] = (countsMap[day] || 0) + 1;
    });

    return Object.entries(countsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // 2 & 3. Monthly Fuel & Maintenance Costs (Bar Chart)
  private async getMonthlyCostsChartData() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

    const [fuelLogs, maintenanceLogs] = await Promise.all([
      prisma.fuelLog.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { date: true, totalCost: true },
      }),
      prisma.maintenance.findMany({
        where: {
          status: MaintenanceStatus.COMPLETED,
          completedDate: { gte: sixMonthsAgo },
        },
        select: { completedDate: true, actualCost: true },
      }),
    ]);

    const monthlyData: Record<string, { month: string; fuel: number; maintenance: number }> = {};

    fuelLogs.forEach((log: any) => {
      const monthKey = log.date.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, fuel: 0, maintenance: 0 };
      }
      monthlyData[monthKey].fuel += Number(log.totalCost);
    });

    maintenanceLogs.forEach((log: any) => {
      if (!log.completedDate) return;
      const monthKey = log.completedDate.toISOString().substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, fuel: 0, maintenance: 0 };
      }
      monthlyData[monthKey].maintenance += Number(log.actualCost || 0);
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }

  // 4. Fleet Utilization Trend (Area Chart)
  private async getUtilizationTrendData(start: Date, end: Date) {
    const days: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    const trips = await prisma.trip.findMany({
      where: {
        createdAt: { gte: start },
        status: { in: [TripStatus.DISPATCHED, TripStatus.COMPLETED] },
      },
      select: {
        tripStartTime: true,
        tripEndTime: true,
      },
    });

    const totalVehicles = await prisma.vehicle.count();

    return days.map((day) => {
      const dayDate = new Date(day);
      const activeTripsCount = trips.filter((t: any) => {
        const startTime = t.tripStartTime ? new Date(t.tripStartTime) : dayDate;
        const endTime = t.tripEndTime ? new Date(t.tripEndTime) : new Date();
        return startTime <= dayDate && endTime >= dayDate;
      }).length;

      const rate = totalVehicles > 0 ? Math.min(100, parseFloat(((activeTripsCount / totalVehicles) * 100).toFixed(1))) : 0;
      return { date: day, rate };
    });
  }

  // 5. Revenue vs Operational Cost (Line Chart)
  private async getRevenueVsCostsData(start: Date, end: Date) {
    const [trips, expenses] = await Promise.all([
      prisma.trip.findMany({
        where: {
          status: TripStatus.COMPLETED,
          tripEndTime: { gte: start, lte: end },
        },
        select: { tripEndTime: true, tripRevenue: true },
      }),
      prisma.expense.findMany({
        where: {
          date: { gte: start, lte: end },
        },
        select: { date: true, amount: true },
      }),
    ]);

    const dataMap: Record<string, { date: string; revenue: number; cost: number }> = {};

    trips.forEach((t: any) => {
      if (!t.tripEndTime) return;
      const day = t.tripEndTime.toISOString().split('T')[0];
      if (!dataMap[day]) {
        dataMap[day] = { date: day, revenue: 0, cost: 0 };
      }
      dataMap[day].revenue += Number(t.tripRevenue);
    });

    expenses.forEach((e: any) => {
      const day = e.date.toISOString().split('T')[0];
      if (!dataMap[day]) {
        dataMap[day] = { date: day, revenue: 0, cost: 0 };
      }
      dataMap[day].cost += Number(e.amount);
    });

    return Object.values(dataMap)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
