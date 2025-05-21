// src/api/routes/v1/loginRoute.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const loginController = require('/app/src/api/controllers/loginController');
const bcrypt = require('bcryptjs');
// Validation rules
const loginValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  body().custom((value, { req }) => {
    if (req.body.email && req.body.phone_number) {
      throw new Error('Use either email or phone_number.');
    }
    if (!req.body.email && !req.body.phone_number) {
      throw new Error('Either email or phone_number is required');
    }
    return true;
  }),

  body('email')
    .if(body('phone_number').not().exists())
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),

  body('phone_number')
    .if(body('email').not().exists())
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Invalid phone number format')
];

// Routes
router.post('/', loginValidation, loginController.login);

module.exports = router;
