
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    senderName: {
        type: String,
        required: true
    },

    senderEmail: {
        type: String,
        required: true
    },

    receiverName: {
        type: String,
        required: true
    },

    receiverEmail: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },

    sentAt: {
        type: Date,
        default: Date.now
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

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
