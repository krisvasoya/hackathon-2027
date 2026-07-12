import { body, param, query } from 'express-validator';
import { VehicleStatus } from '@prisma/client';

// Helper to validate date is not in the future
const isNotFutureDate = (value: string) => {
  const inputDate = new Date(value);
  const today = new Date();
  // Clear times for date-only comparisons if needed, but let's compare simple timestamps
  if (isNaN(inputDate.getTime())) {
    throw new Error('Invalid date format');
  }
  if (inputDate > today) {
    throw new Error('Purchase date cannot be in the future');
  }
  return true;
};

export const createVehicleValidator = [
  body('registrationNumber')
    .trim()
    .notEmpty()
    .withMessage('Registration number is required')
    .isString()
    .withMessage('Registration number must be a string')
    .isLength({ min: 2, max: 20 })
    .withMessage('Registration number must be between 2 and 20 characters'),

  body('vehicleName')
    .trim()
    .notEmpty()
    .withMessage('Vehicle name is required')
    .isString()
    .withMessage('Vehicle name must be a string'),

  body('vehicleModel')
    .trim()
    .notEmpty()
    .withMessage('Vehicle model is required')
    .isString()
    .withMessage('Vehicle model must be a string'),

  body('vehicleType')
    .trim()
    .notEmpty()
    .withMessage('Vehicle type is required')
    .isString()
    .withMessage('Vehicle type must be a string'),

  body('manufacturer')
    .trim()
    .notEmpty()
    .withMessage('Manufacturer is required')
    .isString()
    .withMessage('Manufacturer must be a string'),

  body('manufacturingYear')
    .notEmpty()
    .withMessage('Manufacturing year is required')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage(`Manufacturing year must be a valid integer between 1900 and ${new Date().getFullYear() + 1}`),

  body('maximumLoadCapacity')
    .notEmpty()
    .withMessage('Maximum load capacity is required')
    .isFloat({ gt: 0 })
    .withMessage('Maximum load capacity must be a positive number greater than zero'),

  body('currentOdometer')
    .notEmpty()
    .withMessage('Current odometer is required')
    .isFloat({ min: 0 })
    .withMessage('Current odometer cannot be a negative number'),

  body('acquisitionCost')
    .notEmpty()
    .withMessage('Acquisition cost is required')
    .isFloat({ min: 0 })
    .withMessage('Acquisition cost must be a non-negative number'),

  body('purchaseDate')
    .notEmpty()
    .withMessage('Purchase date is required')
    .isISO8601()
    .withMessage('Purchase date must be a valid ISO8601 date format')
    .custom(isNotFutureDate),

  body('insuranceExpiry')
    .notEmpty()
    .withMessage('Insurance expiry date is required')
    .isISO8601()
    .withMessage('Insurance expiry date must be a valid ISO8601 date format'),

  body('registrationExpiry')
    .notEmpty()
    .withMessage('Registration expiry date is required')
    .isISO8601()
    .withMessage('Registration expiry date must be a valid ISO8601 date format'),

  body('status')
    .optional()
    .isIn(Object.values(VehicleStatus))
    .withMessage(`Status must be one of: ${Object.values(VehicleStatus).join(', ')}`),

  body('region')
    .trim()
    .notEmpty()
    .withMessage('Region is required')
    .isString()
    .withMessage('Region must be a string'),

  body('notes')
    .optional()
    .trim()
    .isString()
    .withMessage('Notes must be a string'),
];

export const updateVehicleValidator = [
  param('id').isUUID().withMessage('Vehicle ID must be a valid UUID'),

  body('registrationNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Registration number cannot be empty')
    .isLength({ min: 2, max: 20 })
    .withMessage('Registration number must be between 2 and 20 characters'),

  body('vehicleName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Vehicle name cannot be empty'),

  body('vehicleModel')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Vehicle model cannot be empty'),

  body('vehicleType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Vehicle type cannot be empty'),

  body('manufacturer')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Manufacturer cannot be empty'),

  body('manufacturingYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage(`Manufacturing year must be between 1900 and ${new Date().getFullYear() + 1}`),

  body('maximumLoadCapacity')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Maximum load capacity must be greater than zero'),

  body('currentOdometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current odometer cannot be negative'),

  body('acquisitionCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Acquisition cost must be a non-negative number'),

  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid ISO8601 date')
    .custom(isNotFutureDate),

  body('insuranceExpiry')
    .optional()
    .isISO8601()
    .withMessage('Insurance expiry date must be a valid ISO8601 date'),

  body('registrationExpiry')
    .optional()
    .isISO8601()
    .withMessage('Registration expiry date must be a valid ISO8601 date'),

  body('status')
    .optional()
    .isIn(Object.values(VehicleStatus))
    .withMessage(`Status must be one of: ${Object.values(VehicleStatus).join(', ')}`),

  body('region')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Region cannot be empty'),

  body('notes')
    .optional()
    .trim()
    .isString(),
];

export const patchVehicleStatusValidator = [
  param('id').isUUID().withMessage('Vehicle ID must be a valid UUID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(VehicleStatus))
    .withMessage(`Status must be one of: ${Object.values(VehicleStatus).join(', ')}`),
];

export const getVehiclesQueryValidator = [
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
  query('sortBy')
    .optional()
    .isString()
    .withMessage('sortBy must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('sortOrder must be either asc or desc'),
  query('search')
    .optional()
    .trim()
    .isString(),
  query('status')
    .optional()
    .isIn(Object.values(VehicleStatus))
    .withMessage(`Status must be one of: ${Object.values(VehicleStatus).join(', ')}`),
  query('type')
    .optional()
    .trim()
    .isString(),
  query('region')
    .optional()
    .trim()
    .isString(),
];
