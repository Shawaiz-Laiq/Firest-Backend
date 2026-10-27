
const mongoose = require('mongoose');

const noteHistorySchema = new mongoose.Schema({
 originalNoteId: {
  type: mongoose.Schema.Types.ObjectId,
  required: true
},
title: {
  type: String,
  required: true
},
createdAt: {
  type: Date,
  required: true
},
deletedAt: {
  type: Date,
  default: null
}});

module.exports = mongoose.model('NoteHistory', noteHistorySchema);
