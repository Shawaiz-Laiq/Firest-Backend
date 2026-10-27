const mongoose = require('mongoose');

const LoginActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  loginAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('LoginActivity', LoginActivitySchema);