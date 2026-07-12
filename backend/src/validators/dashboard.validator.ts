import { query } from 'express-validator';

export const getDashboardQueryValidator = [
  query('preset')
    .optional()
    .isIn(['today', '7days', '30days', 'custom'])
    .withMessage('Preset must be one of: today, 7days, 30days, custom'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date string'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date string'),
];
