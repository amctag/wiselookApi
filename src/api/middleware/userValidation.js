// src/api/middleware/userValidation.js
const Joi = require('joi');

// Password complexity requirements
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// User schema for creation
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(passwordRegex).required().messages({
    'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
  }),
  phone_number: Joi.string().required(),
  user_type_id: Joi.number().integer().required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  profile_picture: Joi.string().uri().allow(null, ''),
  driver_license_number: Joi.string().allow(null, ''),
  vehicle_type: Joi.string().allow(null, ''),
  vehicle_plate_number: Joi.string().allow(null, ''),
  payment_method_id: Joi.number().integer().allow(null)
});

// User schema for update (all fields optional except id in params)
const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  password: Joi.string().pattern(passwordRegex).messages({
    'string.pattern.base': 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
  }),
  phone_number: Joi.string(),
  first_name: Joi.string(),
  last_name: Joi.string(),
  profile_picture: Joi.string().uri().allow(null, ''),
  driver_license_number: Joi.string().allow(null, ''),
  vehicle_type: Joi.string().allow(null, ''),
  vehicle_plate_number: Joi.string().allow(null, ''),
  payment_method_id: Joi.number().integer().allow(null)
}).min(1); // at least one field required for update

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.context.key,
      message: detail.message
    }));
    return res.status(400).json({ errors });
  }
  next();
};

module.exports = {
  validateCreateUser: validate(createUserSchema),
  validateUpdateUser: validate(updateUserSchema),
  validateLogin: validate(loginSchema),
};