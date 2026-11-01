const mongoose = require("mongoose");

const DeletedUserArchiveSchema = new mongoose.Schema({
    originalUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: String,
    email: String,
    deletionType: String,
    deletedAt: Date,
    pdfFileId: { type: mongoose.Schema.Types.ObjectId, required: false }, // <-- required false karo
    downloadTokenHash: { type: String, required: true },
    downloadTokenExpires: Date,
    emailSent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("DeletedUserArchive", DeletedUserArchiveSchema);