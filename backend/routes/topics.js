const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');

const {
  getAllTopics,
  createTopic,
  getTopicById,
  getTopicsByUnit,
  updateTopic,
  deleteTopic,
  getTopicAudio,
} = require('../controllers/topicController');

const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.post('/', [auth, admin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'titleAudio', maxCount: 1 }])], createTopic);
router.put('/:id', [auth, admin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'titleAudio', maxCount: 1 }])], updateTopic);
router.delete('/:id', [auth, admin], deleteTopic);

router.get('/', auth, (req, res, next) => {
  // If unit query parameter is provided, get topics by unit
  // Otherwise, get all topics
  if (req.query.unit) {
    return getTopicsByUnit(req, res, next);
  }
  return getAllTopics(req, res, next);
});
router.get('/:id', auth, getTopicById);
router.get('/:id/audio', getTopicAudio);
router.get('/:id/title-audio', getTopicAudio); // Reusing getTopicAudio with query param or logic inside

module.exports = router;