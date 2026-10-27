const mongoose = require('mongoose');

const DeletedUserSchema = new mongoose.Schema({
    originalUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
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
    time: Date,
    createdAt: Date,
    deletedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DeletedUser', DeletedUserSchema);