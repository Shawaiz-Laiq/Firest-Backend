
const mongoose = require('mongoose');

const SendAttemptSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attemptedReceiver: {
    type: String,
    default: null
  },
  reason: {
    type: String,
    required: true
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SendAttempt', SendAttemptSchema);
