
const mongoose = require('mongoose');

const SentNoteSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  },

  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    immutable: true
  },

  senderName: {
    type: String,
    required: true,
    immutable: true
  },

  receiverName: {
    type: String,
    required: true,
    immutable: true
  },

  originalNoteId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    immutable: true
  },

  title: {
    type: String,
    required: true,
    immutable: true
  },

  description: {
    type: String,
    required: true,
    immutable: true
  },

  sentAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
    isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
});

SentNoteSchema.index({ sender: 1, sentAt: -1 });
SentNoteSchema.index({ receiver: 1, sentAt: -1 });

module.exports = mongoose.model('SentNote', SentNoteSchema);
