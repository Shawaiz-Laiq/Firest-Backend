
const PDFDocument = require("pdfkit");

const generateDeletionPdf = async ({
    user,
    notes = [],
    sentNotes = [],
    receivedNotes = [],
    deletionType,
    deletedAt
}) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: "A4"
            });

            const chunks = [];

            doc.on("data", chunk => chunks.push(chunk));

            doc.on("end", () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on("error", reject);

            const formatDate = (date) => {
                if (!date) return "Not available";
                return new Date(date).toLocaleString("en-US");
            };

            const addSection = (heading) => {
                doc.moveDown(1);
                doc.fontSize(16).fillColor("#1d4ed8").text(heading);
                doc.moveDown(0.5);
                doc.fontSize(10).fillColor("#222222");
            };

            const addEntry = (label, value) => {
                doc.font("Helvetica-Bold").text(`${label}: `, {
                    continued: true
                });

                doc.font("Helvetica").text(
                    String(value ?? "Not available")
                );
            };

            // PDF Heading
            doc.fontSize(22)
                .fillColor("#111827")
                .text("iNotebook - Account Data Archive", {
                    align: "center"
                });

            doc.moveDown(1);

            // Account Details
            addSection("Account Details");

            addEntry("User ID", user._id);
            addEntry("Name", user.name);
            addEntry("Email", user.email);
            addEntry("Account Created", formatDate(user.createdAt));
            addEntry("Deletion Date", formatDate(deletedAt));
            addEntry("Deletion Type", deletionType);

            // Personal Notes
            addSection(`Personal Notes (${notes.length})`);

            if (notes.length === 0) {
                doc.text("No personal notes found.");
            }

            notes.forEach((note, index) => {
                doc.moveDown(0.5);
                doc.font("Helvetica-Bold")
                    .text(`${index + 1}. ${note.title}`);

                doc.font("Helvetica")
                    .text(note.description);

                addEntry("Created", formatDate(note.time));
            });

            // Sent Notes
            addSection(`Sent Notes (${sentNotes.length})`);

            if (sentNotes.length === 0) {
                doc.text("No sent notes found.");
            }

            sentNotes.forEach((note, index) => {
                doc.moveDown(0.5);
                doc.font("Helvetica-Bold")
                    .text(`${index + 1}. ${note.title}`);

                doc.font("Helvetica")
                    .text(note.description);

                addEntry("Receiver", note.receiverName);
                addEntry("Sent Date", formatDate(note.sentAt));
                addEntry("Read Status", note.isRead ? "Read" : "Unread");
            });

            // Received Notes
            addSection(`Received Notes (${receivedNotes.length})`);

            if (receivedNotes.length === 0) {
                doc.text("No received notes found.");
            }

            receivedNotes.forEach((note, index) => {
                doc.moveDown(0.5);
                doc.font("Helvetica-Bold")
                    .text(`${index + 1}. ${note.title}`);

                doc.font("Helvetica")
                    .text(note.description);

                addEntry("Sender", note.senderName);
                addEntry("Received Date", formatDate(note.sentAt));
                addEntry("Read Status", note.isRead ? "Read" : "Unread");
            });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = generateDeletionPdf;