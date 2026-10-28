const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  time: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  lastSeen: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
   type: Boolean,
   default: false
 },
  deletedAt: {
   type: Date,
   default: null
 },
  isVerified: {
    type: Boolean,
    default: false
 },
 resetPasswordCode: {
  type: String,
  default: null
},
resetPasswordExpires: {
  type: Date,
  default: null
},
verficationCode:String
}, {
  timestamps: true
});
const User = mongoose.model('User' , UserSchema);
User.createIndexes()
module.exports = User