const express = require('express');
const router = express.Router();

const {
  createUnit,
  getUnitsForClass,
  getUnitById,
  updateUnit,
  deleteUnit,
} = require('../controllers/unitController');

const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

router.post('/', [auth, admin], createUnit);

router.get('/for-class/:classId', getUnitsForClass);

router.get('/:id', getUnitById);

router.put('/:id', [auth, admin], updateUnit);

router.delete('/:id', [auth, admin], deleteUnit);

module.exports = router;