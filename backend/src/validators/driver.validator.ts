import { body, param, query } from 'express-validator';
import { DriverStatus } from '@prisma/client';

export const createDriverValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isString()
    .withMessage('Full name must be a string'),

  body('employeeId')
    .optional()
    .trim()
    .isString()
    .withMessage('Employee ID must be a string')
    .isLength({ min: 2, max: 20 })
    .withMessage('Employee ID must be between 2 and 20 characters'),

  body('licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('License number is required')
    .isString()
    .withMessage('License number must be a string')
    .isLength({ min: 5, max: 30 })
    .withMessage('License number must be between 5 and 30 characters'),

  body('licenseCategory')
    .trim()
    .notEmpty()
    .withMessage('License category is required')
    .isString()
    .withMessage('License category must be a string'),

  body('licenseExpiryDate')
    .notEmpty()
    .withMessage('License expiry date is required')
    .isISO8601()
    .withMessage('License expiry date must be a valid ISO8601 date format'),

  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isString()
    .withMessage('Phone number must be a string')
    .matches(/^\+?[0-9\s\-()]{7,20}$/)
    .withMessage('Phone number must be a valid format'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('safetyScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Safety score must be an integer between 0 and 100'),

  body('yearsOfExperience')
    .notEmpty()
    .withMessage('Years of experience is required')
    .isInt({ min: 0 })
    .withMessage('Years of experience cannot be negative'),

  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isString()
    .withMessage('Address must be a string'),

  body('emergencyContact')
    .trim()
    .notEmpty()
    .withMessage('Emergency contact is required')
    .isString()
    .withMessage('Emergency contact must be a string'),

  body('status')
    .optional()
    .isIn(Object.values(DriverStatus))
    .withMessage(`Status must be one of: ${Object.values(DriverStatus).join(', ')}`),

  body('notes')
    .optional()
    .trim()
    .isString()
    .withMessage('Notes must be a string'),
];

export const updateDriverValidator = [
  param('id').isUUID().withMessage('Driver ID must be a valid UUID'),

  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty'),

  body('employeeId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Employee ID cannot be empty')
    .isLength({ min: 2, max: 20 })
    .withMessage('Employee ID must be between 2 and 20 characters'),

  body('licenseNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('License number cannot be empty')
    .isLength({ min: 5, max: 30 })
    .withMessage('License number must be between 5 and 30 characters'),

  body('licenseCategory')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('License category cannot be empty'),

  body('licenseExpiryDate')
    .optional()
    .isISO8601()
    .withMessage('License expiry date must be a valid ISO8601 date'),

  body('phoneNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .matches(/^\+?[0-9\s\-()]{7,20}$/)
    .withMessage('Phone number must be a valid format'),

  body('email')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Email address cannot be empty')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('safetyScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Safety score must be between 0 and 100'),

  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience cannot be negative'),

  body('address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Address cannot be empty'),

  body('emergencyContact')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Emergency contact cannot be empty'),

  body('status')
    .optional()
    .isIn(Object.values(DriverStatus))
    .withMessage(`Status must be one of: ${Object.values(DriverStatus).join(', ')}`),

  body('notes')
    .optional()
    .trim()
    .isString(),
];

export const patchDriverStatusValidator = [
  param('id').isUUID().withMessage('Driver ID must be a valid UUID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(DriverStatus))
    .withMessage(`Status must be one of: ${Object.values(DriverStatus).join(', ')}`),
];

export const getDriversQueryValidator = [
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
    .isIn(Object.values(DriverStatus))
    .withMessage(`Status must be one of: ${Object.values(DriverStatus).join(', ')}`),
  query('licenseCategory')
    .optional()
    .trim()
    .isString(),
  query('minSafetyScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('minSafetyScore must be an integer between 0 and 100')
    .toInt(),
  query('maxSafetyScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('maxSafetyScore must be an integer between 0 and 100')
    .toInt(),
  query('licenseExpiryBefore')
    .optional()
    .isISO8601()
    .withMessage('licenseExpiryBefore must be a valid ISO8601 date')
    .customSanitizer((value) => new Date(value)),
];
