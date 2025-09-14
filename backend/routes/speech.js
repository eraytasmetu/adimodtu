const express = require('express');
const router = express.Router();
const { synthesizeSpeech } = require('../controllers/speechController');
const auth = require('../middleware/authMiddleware');

// Gelen metni sese çevirecek API ucu
// Sadece giriş yapmış kullanıcılar bu özelliği kullanabilsin diye 'auth' ile koruyoruz.
router.post('/',  synthesizeSpeech);

module.exports = router;