
const mongoose = require("mongoose");

const DeletedUserArchiveSchema = new mongoose.Schema({
    originalUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true
    },

    deletionType: {
        type: String,
        enum: ["self-deleted", "admin-deleted"],
        required: true
    },

    deletedAt: {
        type: Date,
        default: Date.now
    },

    pdfFileId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    downloadTokenHash: {
        type: String,
        required: true,
        select: false
    },

    downloadTokenExpires: {
        type: Date,
        required: true
    },

    emailSent: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports =
    mongoose.models.DeletedUserArchive ||
    mongoose.model("DeletedUserArchive", DeletedUserArchiveSchema);
