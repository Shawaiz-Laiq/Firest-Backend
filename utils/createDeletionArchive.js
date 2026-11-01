const crypto = require("crypto");
const Note = require("../models/Note");
const SentNote = require("../models/SentNote");
const DeletedUserArchive = require("../models/DeletedUserArchive");
const LoginActivity = require("../models/LoginActivity");
const NameChangeHistory = require("../models/NameChangeHistory");

const createDeletionArchive = async (user, deletionType, req) => {
    console.log("Creating archive WITHOUT GridFS for:", user.email);

    const notes = await Note.find({ user: user._id }).lean();
    const sentNotes = await SentNote.find({ sender: user._id }).lean();
    const receivedNotes = await SentNote.find({ receiver: user._id }).lean();

    const downloadToken = crypto.randomBytes(32).toString("hex");
    const downloadTokenHash = crypto.createHash("sha256").update(downloadToken).digest("hex");
    const downloadTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const archive = await DeletedUserArchive.create({
        originalUserId: user._id,
        name: user.name,
        email: user.email,
        deletionType,
        deletedAt: new Date(),
        archiveData: {
            notes,
            sentNotes,
            receivedNotes,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        },
        downloadTokenHash,
        downloadTokenExpires
    });
    const loginActivities = await LoginActivity.find({
    user: user._id
}).sort({ loginAt: 1 }).lean();

const nameChanges = await NameChangeHistory.find({
    user: user._id
}).sort({ changedAt: 1 }).lean();
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

    console.log("Archive created WITHOUT PDF:", archive._id);

    const backendUrl = process.env.API_BASE_URL || `http://${req?.headers?.host}` || "http://localhost:5000";
    const downloadUrl = `${backendUrl}/api/auth/deletion-archive/${downloadToken}`;

    return { success: true, archiveId: archive._id, downloadUrl };
};

module.exports = createDeletionArchive;