
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectToMongoose = require('./bd');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('iNotebook Backend is running!');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

const startServer = async () => {
  try {
    await connectToMongoose();

    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
