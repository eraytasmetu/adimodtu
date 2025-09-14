const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const token = req.header('authtoken');
  console.log('token:', token);
  if (!token) {
    return res.status(401).json({ msg: 'Token bulunamadı, yetkilendirme reddedildi' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.user.id).select('-password');
    if (!req.user) {
        return res.status(401).json({ msg: 'Kullanıcı bulunamadı, yetkilendirme reddedildi'});
    }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token geçerli değil' });
  }
};