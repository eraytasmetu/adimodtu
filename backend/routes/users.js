const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const {
  registerUser,
  loginUser,
  getUserProfile,
  trackTopicListening,
  trackQuestionCompletion,
  getUserProgress,
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', auth, getUserProfile);
router.post('/track-topic/:topicId', auth, trackTopicListening);
router.post('/track-question', auth, trackQuestionCompletion);
router.get('/progress', auth, getUserProgress);

module.exports = router;