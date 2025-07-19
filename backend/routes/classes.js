const express = require('express');
const router = express.Router();

const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} = require('../controllers/classController');

const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.post('/', [auth, admin], createClass);

router.get('/', getAllClasses);

router.get('/:id', getClassById);

router.put('/:id', [auth, admin], updateClass);

router.delete('/:id', [auth, admin], deleteClass);

module.exports = router;