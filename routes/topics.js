const express = require('express');
const router = express.Router();

const {
  createTopic,
  getTopicById,
  updateTopic,
  deleteTopic,
} = require('../controllers/topicController');

const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.post('/', [auth, admin], createTopic);

router.get('/:id', getTopicById);

router.put('/:id', [auth, admin], updateTopic);

router.delete('/:id', [auth, admin], deleteTopic);

module.exports = router;