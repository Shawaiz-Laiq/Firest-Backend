const crypto = require("crypto");
const Note = require("../models/Note");
const SentNote = require("../models/SentNote");
const DeletedUserArchive = require("../models/DeletedUserArchive");
const generateDeletionPdf = require("./generateDeletionPdf");
const uploadDeletionPdf = require("./uploadDeletionPdf");

const createDeletionArchive = async (user, deletionType, req) => {
    try {
        const deletedAt = new Date();
        const notes = await Note.find({ user: user._id }).lean();
        const sentNotes = await SentNote.find({ sender: user._id }).lean();
        const receivedNotes = await SentNote.find({ receiver: user._id }).lean();

        const pdfBuffer = await generateDeletionPdf({
            user, notes, sentNotes, receivedNotes, deletionType, deletedAt
        });

        const filename = `deleted-user-${user._id}-${Date.now()}.pdf`;
        const pdfFileId = await uploadDeletionPdf(pdfBuffer, filename);

        const downloadToken = crypto.randomBytes(32).toString("hex");
        const downloadTokenHash = crypto.createHash("sha256").update(downloadToken).digest("hex");
        const downloadTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const archive = await DeletedUserArchive.create({
            originalUserId: user._id, name: user.name, email: user.email,
            deletionType, deletedAt, pdfFileId, downloadTokenHash, downloadTokenExpires
        });

        // FIX: Fallback URL agar ENV missing ho
        const backendUrl = process.env.API_BASE_URL || process.env.BACKEND_URL || `https://${req?.headers?.host}` || "https://firest-backend.vercel.app";
        const downloadUrl = `${backendUrl}/api/auth/deletion-archive/${downloadToken}`;

        return { success: true, archiveId: archive._id, downloadUrl };
    } catch (err) {
        console.error("Archive creation failed:", err.message);
        // Archive fail bhi ho to account delete hone do, 500 mat do
        return { success: false, archiveId: null, downloadUrl: null, error: err.message };
    }
};
module.exports = createDeletionArchive;