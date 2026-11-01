const mongoose = require("mongoose");

const NameChangeHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    oldName: {
        type: String,
        required: true
    },
    newName: {
        type: String,
        required: true
    },
    changedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model(
    "NameChangeHistory",
    NameChangeHistorySchema
);