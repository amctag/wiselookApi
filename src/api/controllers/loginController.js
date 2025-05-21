const userModel = require("../models/userModel");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");

const loginController = {
  async login(req, res) {
    try {
      const { email, phone_number, password } = req.body;

      if (!password || (!email && !phone_number)) {
        return res.status(400).json({ error: "Missing credentials" });
      }

      const user = email
        ? await userModel.getByEmail(email)
        : await userModel.getByPhone(phone_number);

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

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
      console.error("Login error:", error.message, error.stack);
      return res.status(500).json({ error: "Login failed" });
    }
  },
};

module.exports = loginController;
