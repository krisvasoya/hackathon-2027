import { body, param, query } from 'express-validator';
import { MaintenanceStatus } from '@prisma/client';

export const createMaintenanceValidator = [
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle is required')
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),

  body('maintenanceType')
    .trim()
    .notEmpty()
    .withMessage('Maintenance type is required')
    .isString(),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('priority')
    .trim()
    .notEmpty()
    .withMessage('Priority is required')
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be one of: Low, Medium, High, Critical'),

  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO8601 date format'),

  body('estimatedCost')
    .notEmpty()
    .withMessage('Estimated cost is required')
    .isFloat({ min: 0 })
    .withMessage('Estimated cost cannot be negative'),

  body('workshopName')
    .trim()
    .notEmpty()
    .withMessage('Workshop name is required')
    .isString(),

  body('technicianName')
    .trim()
    .notEmpty()
    .withMessage('Technician name is required')
    .isString(),

  body('notes')
    .optional()
    .trim()
    .isString(),
];

export const updateMaintenanceValidator = [
  param('id').isUUID().withMessage('Maintenance ID must be a valid UUID'),

  body('maintenanceType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Maintenance type cannot be empty'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),

  body('priority')
    .optional()
    .trim()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be one of: Low, Medium, High, Critical'),

  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO8601 date'),

  body('estimatedCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated cost cannot be negative'),

  body('workshopName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Workshop name cannot be empty'),

  body('technicianName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Technician name cannot be empty'),

  body('notes')
    .optional()
    .trim()
    .isString(),
];

export const completeMaintenanceValidator = [
  param('id').isUUID().withMessage('Maintenance ID must be a valid UUID'),

  body('actualCost')
    .notEmpty()
    .withMessage('Actual cost is required')
    .isFloat({ min: 0 })
    .withMessage('Actual cost cannot be negative'),

  body('completedDate')
    .notEmpty()
    .withMessage('Completed date is required')
    .isISO8601()
    .withMessage('Completed date must be a valid ISO8601 date'),

  body('notes')
    .optional()
    .trim()
    .isString(),
];

export const getMaintenanceQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
  query('search')
    .optional()
    .trim()
    .isString(),
  query('status')
    .optional()
    .isIn(Object.values(MaintenanceStatus))
    .withMessage(`Status must be one of: ${Object.values(MaintenanceStatus).join(', ')}`),
  query('vehicleId')
    .optional()
    .isUUID()
    .withMessage('vehicleId must be a valid UUID'),
  query('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Priority must be one of: Low, Medium, High, Critical'),
  query('maintenanceType')
    .optional()
    .isString(),
];
