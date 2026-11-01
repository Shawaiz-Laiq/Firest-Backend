require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectToMongoose = require('./bd');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Har request se pehle DB connection ready karo (serverless ke liye)
app.use(async (req, res, next) => {
  try {
    await connectToMongoose();
    next();
  } catch (error) {
    console.error('DB connection failed:', error.message);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

app.get('/', (req, res) => {
  res.send('iNotebook Backend is running!');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/sendnotes', require('./routes/sendnotes'));

// Sirf local development par server start karo
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
  });
}

module.exports = app;