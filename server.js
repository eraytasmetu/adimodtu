const express = require('express');
const connectDB = require('./config/db');
require('dotenv').config();

connectDB();

const app = express();

app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Çalışıyor'));

app.use('/api/users', require('./routes/users'));

app.use('/api/classes', require('./routes/classes'));

app.use('/api/units', require('./routes/units')); 

app.use('/api/topics', require('./routes/topics'));

app.use('/api/tests', require('./routes/tests'));

const PORT = process.env.PORT || 5757;

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda başlatıldı`));