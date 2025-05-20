// src/api/routes/v1/authRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../../controllers/authController');

// Validation rules
const registerValidation = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase, one lowercase, one number and one special character'),
  body('first_name')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 3 }).withMessage('First name must be at least 3 characters'),
  body('last_name')
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 3 }).withMessage('Last name must be at least 3 characters'),
  body('phone_number').optional().isMobilePhone(),
  body('profile_picture').optional().isString(),
  body('cover_picture').optional().isString(),
  body('birth_date').optional().isDate(),
  body('gender').optional().isString(),
  body('bio').optional().isString()
];

const loginValidation = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone_number) {
      throw new Error('Either email or phone number must be provided');
    }
    return true;
  }),
  body('email').if(body('phone_number').notExists())
    .notEmpty().withMessage('Email is required when phone number is not provided')
    .isEmail().withMessage('Invalid email format'),
  body('phone_number').if(body('email').notExists())
    .notEmpty().withMessage('Phone number is required when email is not provided')
    .isMobilePhone().withMessage('Invalid phone number format')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

module.exports = router;