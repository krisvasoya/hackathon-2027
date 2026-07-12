import { body, param, query } from 'express-validator';

const EXPENSE_TYPES = [
  'Fuel',
  'Maintenance',
  'Toll',
  'Parking',
  'Insurance',
  'Repair',
  'Other',
];

export const createExpenseValidator = [
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle is required')
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),

  body('tripId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Trip ID must be a valid UUID'),

  body('expenseType')
    .trim()
    .notEmpty()
    .withMessage('Expense type is required')
    .isIn(EXPENSE_TYPES)
    .withMessage(`Expense type must be one of: ${EXPENSE_TYPES.join(', ')}`),

  body('amount')
    .notEmpty()
    .withMessage('Expense amount is required')
    .isFloat({ min: 0 })
    .withMessage('Amount cannot be negative'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 250 })
    .withMessage('Description cannot exceed 250 characters'),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO8601 date format'),
];

export const updateExpenseValidator = [
  param('id').isUUID().withMessage('Expense ID must be a valid UUID'),

  body('vehicleId')
    .optional()
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),

  body('tripId')
    .optional({ nullable: true, checkFalsy: true })
    .isUUID()
    .withMessage('Trip ID must be a valid UUID'),

  body('expenseType')
    .optional()
    .trim()
    .isIn(EXPENSE_TYPES)
    .withMessage(`Expense type must be one of: ${EXPENSE_TYPES.join(', ')}`),

  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount cannot be negative'),

  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO8601 date'),
];

export const getExpensesQueryValidator = [
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
  query('expenseType')
    .optional()
    .isIn(EXPENSE_TYPES)
    .withMessage(`expenseType must be one of: ${EXPENSE_TYPES.join(', ')}`),
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
