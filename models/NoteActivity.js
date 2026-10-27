const mongoose = require('mongoose');

const NoteActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['create', 'edit', 'delete'],
    required: true
  },
  noteTitle: {
    type: String,
    default: ''
  },
  activityAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('NoteActivity', NoteActivitySchema);