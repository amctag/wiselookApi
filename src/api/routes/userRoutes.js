const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById } = require('/app/src/api/controllers/userController');

// GET /users
router.get('/', getAllUsers);

// GET /users/:id
router.get('/:id', getUserById);

module.exports = router;
