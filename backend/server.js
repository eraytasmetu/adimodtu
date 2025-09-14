const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors'); 
require('dotenv').config();

connectDB();

const app = express();

// Increase timeout for large requests
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

app.use(cors());

app.use(express.json({ 
  limit: '100mb',
  extended: false 
}));

app.use(express.urlencoded({ 
  limit: '100mb',
  extended: true 
}));

app.get('/', (req, res) => res.send('API Çalışıyor'));

app.use('/api/users', require('./routes/users'));

app.use('/api/classes', require('./routes/classes'));

app.use('/api/units', require('./routes/units')); 

app.use('/api/topics', require('./routes/topics'));

app.use('/api/tests', require('./routes/tests'));

app.use('/api/speech', require('./routes/speech'));

// Error handling for payload too large
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      msg: 'Dosya boyutu çok büyük. Lütfen daha küçük dosyalar kullanın.',
      error: 'PAYLOAD_TOO_LARGE'
    });
  }
  next(err);
});

const PORT = process.env.PORT || 5757;

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda başlatıldı`));