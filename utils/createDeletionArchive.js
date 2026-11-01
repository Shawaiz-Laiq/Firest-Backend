const crypto = require("crypto");
const Note = require("../models/Note");
const SentNote = require("../models/SentNote");
const DeletedUserArchive = require("../models/DeletedUserArchive");
const generateDeletionPdf = require("./generateDeletionPdf");
const uploadDeletionPdf = require("./uploadDeletionPdf");

const createDeletionArchive = async (user, deletionType, req) => {
    console.log("Creating deletion archive for:", user.email);

    let pdfFileId = null;
    
    try {
        const notes = await Note.find({ user: user._id }).lean();
        const sentNotes = await SentNote.find({ sender: user._id }).lean();
        const receivedNotes = await SentNote.find({ receiver: user._id }).lean();

        console.log(`Found ${notes.length} personal notes`);

        const pdfBuffer = await generateDeletionPdf({
            user, notes, sentNotes, receivedNotes, deletionType, deletedAt: new Date()
        });

        console.log("PDF generated, size:", pdfBuffer.length);

        const filename = `deleted-user-${user._id}-${Date.now()}.pdf`;
        pdfFileId = await uploadDeletionPdf(pdfBuffer, filename);

    } catch (pdfError) {
        console.error("PDF generation/upload failed, creating archive without PDF:", pdfError.message);
        pdfFileId = null; // PDF fail bhi ho to archive banega
    }

    // Archive to har haal me banega
    const downloadToken = crypto.randomBytes(32).toString("hex");
    const downloadTokenHash = crypto.createHash("sha256").update(downloadToken).digest("hex");
    const downloadTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const archive = await DeletedUserArchive.create({
        originalUserId: user._id,
        name: user.name,
        email: user.email,
        deletionType,
        deletedAt: new Date(),
        pdfFileId, // null bhi ho sakta hai
        downloadTokenHash,
        downloadTokenExpires
    });

    console.log("Archive created successfully:", archive._id);

    const backendUrl = process.env.API_BASE_URL || `http://${req?.headers?.host}` || "http://localhost:5000";
    const downloadUrl = `${backendUrl}/api/auth/deletion-archive/${downloadToken}`;

    return { success: true, archiveId: archive._id, downloadUrl, pdfFileId };
};

module.exports = createDeletionArchive;