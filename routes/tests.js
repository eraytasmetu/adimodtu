const express = require('express');
const router = express.Router();

const {
  createTest,
  getTestById,
  updateTest,
  deleteTest,
  checkQuestionAnswer, 
  completeTest,     
} = require('../controllers/testController');

const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.post('/', [auth, admin], createTest);
router.put('/:id', [auth, admin], updateTest);
router.delete('/:id', [auth, admin], deleteTest);

router.get('/:id', auth, getTestById);
router.post('/:testId/questions/:questionId/check', auth, checkQuestionAnswer);
router.post('/:id/complete', auth, completeTest);

module.exports = router;

