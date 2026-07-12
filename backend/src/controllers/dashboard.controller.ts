import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response.util';

export class DashboardController {
  private readonly dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const preset = req.query.preset as 'today' | '7days' | '30days' | 'custom' | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await this.dashboardService.getDashboardData({
        preset,
        startDate,
        endDate,
      });

      sendSuccess(res, result, 'Enterprise dashboard statistics calculated successfully');
    } catch (error) {
      next(error);
    }
  };
}
