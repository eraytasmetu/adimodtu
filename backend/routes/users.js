const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', auth, getUserProfile);

module.exports = router;