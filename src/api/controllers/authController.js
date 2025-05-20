// src/api/controllers/authController.js
const userModel = require("../models/userModel");
const { validationResult } = require("express-validator");

const authController = {
  async register(req, res) {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      username,
      email,
      password,
      first_name,
      last_name,
      phone_number,
      profile_picture,
      cover_picture,
      birth_date,
      gender,
      bio,
    } = req.body;

    try {
      // Check if email already exists
      const emailExists = await userModel.getByEmail(email);
      if (emailExists) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Check if username already exists
      const usernameExists = await userModel.getByUsername(username);
      if (usernameExists) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Create new user
      const newUser = await userModel.create({
        username,
        email,
        password, // Hash password? lOl
        first_name,
        last_name,
        phone_number,
        profile_picture,
        cover_picture,
        birth_date,
        gender,
        bio,
      });

      return res.status(201).json({
        message: "User registered successfully",
        user: newUser,
      });
    } catch (error) {
      // console.error('Registration error:', error);
      console.error("Registration error:", error.message, error.stack);
      return res
        .status(500)
        .json({ error: "Failed to create user, please try again." });
    }
  },

  async login(req, res) {
    try {
      const { email, phone_number, password } = req.body;

      // Input validation
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }
      if (!email && !phone_number) {
        return res
          .status(400)
          .json({ error: "Email or phone number is required" });
      }

      // Find user
      const user = email
        ? await userModel.getByEmail(email)
        : await userModel.getByPhone(phone_number);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // PLAIN TEXT COMPARISON (TEMPORARY MEASURE)
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Basic success response (without JWT for now)
      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed, please try again." });
    }
  },

};

module.exports = authController;
