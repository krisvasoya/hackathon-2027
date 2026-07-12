import { body, param, query } from 'express-validator';
import { TripStatus } from '@prisma/client';

export const createTripValidator = [
  body('source')
    .trim()
    .notEmpty()
    .withMessage('Source location is required')
    .isString(),

  body('destination')
    .trim()
    .notEmpty()
    .withMessage('Destination location is required')
    .isString(),

  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle is required')
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),

  body('driverId')
    .notEmpty()
    .withMessage('Driver is required')
    .isUUID()
    .withMessage('Driver ID must be a valid UUID'),

  body('cargoWeight')
    .notEmpty()
    .withMessage('Cargo weight is required')
    .isFloat({ gt: 0 })
    .withMessage('Cargo weight must be a positive number greater than zero'),

  body('plannedDistance')
    .notEmpty()
    .withMessage('Planned distance is required')
    .isFloat({ gt: 0 })
    .withMessage('Planned distance must be a positive number greater than zero'),

  body('estimatedDuration')
    .notEmpty()
    .withMessage('Estimated duration is required')
    .isInt({ gt: 0 })
    .withMessage('Estimated duration must be a positive integer in minutes'),

  body('tripRevenue')
    .notEmpty()
    .withMessage('Trip revenue is required')
    .isFloat({ min: 0 })
    .withMessage('Trip revenue must be a non-negative number'),

  body('remarks')
    .optional()
    .trim()
    .isString(),
];

export const updateTripValidator = [
  param('id').isUUID().withMessage('Trip ID must be a valid UUID'),

  body('source')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Source cannot be empty'),

  body('destination')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Destination cannot be empty'),

  body('vehicleId')
    .optional()
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),

  body('driverId')
    .optional()
    .isUUID()
    .withMessage('Driver ID must be a valid UUID'),

  body('cargoWeight')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Cargo weight must be greater than zero'),

  body('plannedDistance')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Planned distance must be greater than zero'),

  body('estimatedDuration')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('Estimated duration must be a positive integer'),

  body('tripRevenue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Trip revenue must be a non-negative number'),

  body('remarks')
    .optional()
    .trim()
    .isString(),
];

export const completeTripValidator = [
  param('id').isUUID().withMessage('Trip ID must be a valid UUID'),
  body('endOdometer')
    .notEmpty()
    .withMessage('End odometer is required')
    .isFloat({ min: 0 })
    .withMessage('End odometer cannot be negative'),
  body('actualDistance')
    .notEmpty()
    .withMessage('Actual distance is required')
    .isFloat({ gt: 0 })
    .withMessage('Actual distance must be greater than zero'),
];

export const getTripsQueryValidator = [
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
    .isString(),
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
    .isIn(Object.values(TripStatus))
    .withMessage(`Status must be one of: ${Object.values(TripStatus).join(', ')}`),
  query('vehicleId')
    .optional()
    .isUUID()
    .withMessage('vehicleId must be a valid UUID'),
  query('driverId')
    .optional()
    .isUUID()
    .withMessage('driverId must be a valid UUID'),
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
