
const crypto = require("crypto");

const Note = require("../models/Note");
const SentNote = require("../models/SentNote");
const DeletedUserArchive = require("../models/DeletedUserArchive");
const LoginActivity = require("../models/LoginActivity");
const NameChangeHistory = require("../models/NameChangeHistory");

const generateDeletionPdf = require("./generateDeletionPdf");
const uploadDeletionPdf = require("./uploadDeletionPdf");

const createDeletionArchive = async (user, deletionType) => {
    try {
        console.log("Creating deletion archive for:", user.email);

        // 1. Deletion date
        const deletedAt = new Date();

        // 2. Check API URL before creating/uploading PDF
        const backendUrl = process.env.API_BASE_URL;

        if (!backendUrl) {
            throw new Error("API_BASE_URL is missing in environment variables");
        }

        // 3. Collect personal notes
        const notes = await Note.find({
            user: user._id
        }).lean();

        // 4. Collect sent notes
        const sentNotes = await SentNote.find({
            sender: user._id
        }).lean();

        // 5. Collect received notes
        const receivedNotes = await SentNote.find({
            receiver: user._id
        }).lean();

        // 6. Collect login history
        const loginActivities = await LoginActivity.find({
            user: user._id
        })
        .sort({ loginAt: 1 })
        .lean();

        // 7. Collect name change history
        const nameChanges = await NameChangeHistory.find({
            user: user._id
        })
        .sort({ changedAt: 1 })
        .lean();

        // 8. Generate PDF
        const pdfBuffer = await generateDeletionPdf({
            user,
            notes,
            sentNotes,
            receivedNotes,
            loginActivities,
            nameChanges,
            deletionType,
            deletedAt
        });

        if (!pdfBuffer || !pdfBuffer.length) {
            throw new Error("PDF generation failed: Empty PDF buffer");
        }

        // 9. Upload PDF to MongoDB GridFS
        const filename = `deleted-user-${user._id}-${Date.now()}.pdf`;

        const pdfFileId = await uploadDeletionPdf(
            pdfBuffer,
            filename
        );

        // 10. Generate secure download token
        const downloadToken = crypto.randomBytes(32).toString("hex");

        const downloadTokenHash = crypto
            .createHash("sha256")
            .update(downloadToken)
            .digest("hex");

        const downloadTokenExpires = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        );

        // 11. Save archive information in MongoDB
        const archive = await DeletedUserArchive.create({
            originalUserId: user._id,
            name: user.name,
            email: user.email,
            deletionType,
            deletedAt,
            pdfFileId,
            downloadTokenHash,
            downloadTokenExpires,
            emailSent: false
        });

        // 12. Create download URL
        const downloadUrl =
            `${backendUrl.replace(/\/+$/, "")}/api/auth/deletion-archive/${downloadToken}`;

        console.log("Deletion archive created successfully:", archive._id);

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

    } catch (error) {
        console.error("Create deletion archive error:", error);
        throw error;
    }
};

module.exports = createDeletionArchive;
