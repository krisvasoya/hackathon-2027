import { body, param, query } from 'express-validator';

export const createFuelLogValidator = [
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle is required')
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),

  body('tripId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Trip ID must be a valid UUID'),

  body('liters')
    .notEmpty()
    .withMessage('Liters quantity is required')
    .isFloat({ gt: 0 })
    .withMessage('Liters must be a positive number greater than zero'),

  body('pricePerLiter')
    .notEmpty()
    .withMessage('Price per liter is required')
    .isFloat({ gt: 0 })
    .withMessage('Price per liter must be a positive number greater than zero'),

  body('totalCost')
    .notEmpty()
    .withMessage('Total cost is required')
    .isFloat({ gt: 0 })
    .withMessage('Total cost must be a positive number greater than zero'),

  body('odometer')
    .notEmpty()
    .withMessage('Odometer reading is required')
    .isFloat({ min: 0 })
    .withMessage('Odometer reading cannot be negative'),

  body('fuelStation')
    .trim()
    .notEmpty()
    .withMessage('Fuel station is required')
    .isString(),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO8601 date format'),
];

export const updateFuelLogValidator = [
  param('id').isUUID().withMessage('Fuel Log ID must be a valid UUID'),

  body('vehicleId')
    .optional()
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),

  body('tripId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Trip ID must be a valid UUID'),

  body('liters')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Liters must be a positive number greater than zero'),

  body('pricePerLiter')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Price per liter must be a positive number greater than zero'),

  body('totalCost')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Total cost must be a positive number greater than zero'),

  body('odometer')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Odometer reading cannot be negative'),

  body('fuelStation')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Fuel station cannot be empty'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO8601 date'),
];

export const getFuelLogsQueryValidator = [
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
  query('vehicleId')
    .optional()
    .isUUID()
    .withMessage('vehicleId must be a valid UUID'),
  query('tripId')
    .optional()
    .isUUID()
    .withMessage('tripId must be a valid UUID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date')
    .customSanitizer((v) => new Date(v)),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date')
    .customSanitizer((v) => new Date(v)),
];
