const crypto = require("crypto");


const Note = require("../models/Note");
const SentNote = require("../models/SentNote");
const DeletedUserArchive = require("../models/DeletedUserArchive");

const generateDeletionPdf = require("./generateDeletionPdf");
const uploadDeletionPdf = require("./uploadDeletionPdf");

const {
    SendAccountDeletionEmail
} = require("../middleware/Email");


const createDeletionArchive = async (user, deletionType) => {

    const deletedAt = new Date();

    // 1. Fetch personal notes
    const notes = await Note.find({
        user: user._id
    }).lean();

    // 2. Fetch sent notes
    const sentNotes = await SentNote.find({
        sender: user._id
    }).lean();

    // 3. Fetch received notes
    const receivedNotes = await SentNote.find({
        receiver: user._id
    }).lean();

    // 4. Generate PDF
    const pdfBuffer = await generateDeletionPdf({
        user,
        notes,
        sentNotes,
        receivedNotes,
        deletionType,
        deletedAt
    });

    // 5. Upload PDF to MongoDB GridFS
    const filename = `deleted-user-${user._id}-${Date.now()}.pdf`;

    const pdfFileId = await uploadDeletionPdf(
        pdfBuffer,
        filename
    );

    // 6. Generate secure download token
    const downloadToken = crypto.randomBytes(32).toString("hex");

    const downloadTokenHash = crypto
        .createHash("sha256")
        .update(downloadToken)
        .digest("hex");

    const downloadTokenExpires = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    // 7. Save archive metadata
    const archive = await DeletedUserArchive.create({
        originalUserId: user._id,
        name: user.name,
        email: user.email,
        deletionType,
        deletedAt,
        pdfFileId,
        downloadTokenHash,
        downloadTokenExpires
    });

    // 8. Create download URL
    const backendUrl = process.env.API_BASE_URL;

    if (!backendUrl) {
        throw new Error("API_BASE_URL is missing in environment variables");
    }

    const downloadUrl =
        `${backendUrl}/api/auth/deletion-archive/${downloadToken}`;

    // 9. Send deletion email
    // Return archive information.
// Email will be sent only after account deletion succeeds.

return {
    success: true,
    archiveId: archive._id,
    downloadUrl,
    user: {
        _id: user._id,
        name: user.name,
        email: user.email
    },
    deletionType
};
};

module.exports = createDeletionArchive;
