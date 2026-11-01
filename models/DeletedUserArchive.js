const mongoose = require("mongoose");

const DeletedUserArchiveSchema = new mongoose.Schema({
    originalUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: String,
    email: String,
    deletionType: String,
    deletedAt: Date,
    // PDF file id ki zarurat nahi
    archiveData: { // Saara data yahin save hoga
        notes: Array,
        sentNotes: Array,
        receivedNotes: Array,
        user: Object
    },
    downloadTokenHash: { type: String, required: true },
    downloadTokenExpires: Date,
    emailSent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("DeletedUserArchive", DeletedUserArchiveSchema);