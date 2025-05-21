// src/api/models/userModel.js
const db = require("../../config/db");

module.exports = {
  /**
   * Get all users (paginated)
   */
  async getAll(limit = 10, offset = 0) {
    const { rows } = await db.query(
      `SELECT * FROM users 
      WHERE deleted_at IS NULL 
      AND is_active = true
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  },

  /**
   * Get user by ID
   */
  async getById(id) {
    const { rows } = await db.query(
      `SELECT * FROM users
       WHERE id = $1 
       AND deleted_at IS NULL
       AND is_active = true
       `,
      [id]
    );
    return rows[0];
  },

  /**
   * Create new user
   */
  async create(userData) {
    const { rows } = await db.query(
      `INSERT INTO users (
        username,
        email,
        password,
        phone_number,
        first_name,
        last_name,
        profile_picture,
        cover_picture,
        birth_date,
        gender,
        bio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, username, email, first_name, last_name, created_at`,
      [
        userData.username,
        userData.email,
        userData.password,
        userData.phone_number || null,
        userData.first_name,
        userData.last_name,
        userData.profile_picture || null,
        userData.cover_picture || null,
        userData.birth_date || null,
        userData.gender || null,
        userData.bio || null
      ]
    );
    return rows[0];
  },

  /**
   * Update user
   */
  async update(id, userData) {
    const { rows } = await db.query(
      `UPDATE users SET
        email = COALESCE($1, email),
        phone_number = COALESCE($2, phone_number),
        first_name = COALESCE($3, first_name),
        last_name = COALESCE($4, last_name),
        profile_picture = COALESCE($5, profile_picture),
        driver_license_number = COALESCE($6, driver_license_number),
        vehicle_type = COALESCE($7, vehicle_type),
        vehicle_plate_number = COALESCE($8, vehicle_plate_number),
        payment_method_id = COALESCE($9, payment_method_id),
        updated_at = NOW()
      WHERE id = $10 AND deleted_at IS NULL
      RETURNING *`,
      [
        userData.email,
        userData.phone_number,
        userData.first_name,
        userData.last_name,
        userData.profile_picture,
        userData.driver_license_number,
        userData.vehicle_type,
        userData.vehicle_plate_number,
        userData.payment_method_id,
        id,
      ]
    );
    return rows[0];
  },

  /**
   * Soft delete user
   */
  async delete(id) {
    const { rows } = await db.query(
      "UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = $1 RETURNING *",
      [id]
    );
    return rows[0];
  },

  async getByEmail(email) {
    const { rows } = await db.query(
      `SELECT * FROM users 
         WHERE email = $1 
         AND deleted_at IS NULL
         AND is_active = true`,
      [email]
    );
    return rows[0];
  },

  async getByUsername(username) {
    const { rows } = await db.query(
      `SELECT * FROM users 
         WHERE username = $1 
         AND deleted_at IS NULL
         AND is_active = true`,
      [username]
    );
    return rows[0];
  },

  async getByPhone(phone_number) {
    const query = 'SELECT * FROM users WHERE phone_number = $1 AND is_active = true';
    const { rows } = await db.query(query, [phone_number]);
    return rows[0];
  },

  async updateLastLogin(userId) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
    await db.query(query, [userId]);
  },
};
