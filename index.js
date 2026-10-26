const connectToMongoose = require('./bd');
const express = require('express');
var cors = require('cors')
connectToMongoose();
const app = express()
require('dotenv').config();
//const port = process.env.PORT


app.use(cors())
app.use(express.json())
app.get('/', (req, res) => {
    res.send('iNotebook Backend is running!');
});

app.use('/api/auth', require('./routes/auth'))
app.use('/api/notes', require('./routes/notes'))


// app.listen(port, () => {
//   console.log(`Example app listening on port  http://localhost:${port}`)
// })
