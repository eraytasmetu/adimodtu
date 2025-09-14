const express = require('express');
const router = express.Router();

const {
  getAllTests,
  createTest,
  getTestById,
  getTestsByUnit,
  updateTest,
  deleteTest,
  checkQuestionAnswer, 
  completeTest,
  getQuestionAudio,
  getOptionAudio,
} = require('../controllers/testController');

const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.post('/', [auth, admin], createTest);
router.put('/:id', [auth, admin], updateTest);
router.delete('/:id', [auth, admin], deleteTest);

router.get('/', auth, (req, res, next) => {
  // If unit query parameter is provided, get tests by unit
  // Otherwise, get all tests
  if (req.query.unit) {
    return getTestsByUnit(req, res, next);
  }
  return getAllTests(req, res, next);
});
router.get('/:id', auth, getTestById);
router.get('/:testId/questions/:questionId/audio/:audioType', auth, getQuestionAudio);
router.get('/:testId/questions/:questionId/options/:optionId/audio', auth, getOptionAudio);
router.post('/:testId/questions/:questionId/check', auth, checkQuestionAnswer);
router.post('/:id/complete', auth, completeTest);

module.exports = router;

