const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const userModel = require("app/src/api/models/userModel");

const loginController = async (req, res) => {
  try {
    console.log("🔐 Login request received with body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone_number, password } = req.body;

    if (!password) {
      console.log("❌ Password is missing");
      return res.status(400).json({ message: "Password is required" });
    }

    let user;
    if (email) {
      console.log("🔍 Searching by email:", email);
      user = await userModel.getByEmail(email);
    } else if (phone_number) {
      console.log("🔍 Searching by phone number:", phone_number);
      user = await userModel.getByPhone(phone_number);
    } else {
      console.log("❌ No email or phone provided");
      return res.status(400).json({ message: "Email or phone number is required" });
    }

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ User found:", user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("🔐 Password match:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ Incorrect password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ Login successful");
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("🔥 Error in loginController:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = loginController;
