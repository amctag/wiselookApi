// src/api/controllers/loginController.js
const userModel = require("../models/userModel");
const { validationResult } = require("express-validator");

const loginController = {
  async login(req, res) {
    try {
      const { email, phone_number, password } = req.body;

      // Find user by single identifier
      const user = email
        ? await userModel.getByEmail(email)
        : await userModel.getByPhone(phone_number);

      // User not found or password mismatch
      if (!user || user.password !== password) {
        // Plain text comparison
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Successful login
      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone_number: user.phone_number,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  },
};

module.exports = loginController;
