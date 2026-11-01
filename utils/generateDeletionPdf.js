const PDFDocument = require("pdfkit");

const generateDeletionPdf = (data) => {
    return new Promise((resolve, reject) => {
        try {
           const {
    user,
    notes = [],
    sentNotes = [],
    receivedNotes = [],
    loginActivities = [],
    nameChanges = [],
    deletionType,
    deletedAt
} = data;
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                bufferPages: true
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                console.log("PDF generated successfully, size:", pdfData.length);
                resolve(pdfData);
            });
            doc.on('error', (err) => {
                console.error("PDF doc error:", err);
                reject(err);
            });

            // --- CONTENT START ---
            doc.fontSize(20).text('iNotebook - Account Data Archive', { align: 'center' });
            doc.moveDown(1);

            doc.fontSize(12);
            doc.text(`Name: ${user?.name || 'N/A'}`);
            doc.text(`Email: ${user?.email || 'N/A'}`);
            doc.text(`User ID: ${user?._id || 'N/A'}`);
            doc.text(`Deletion Date: ${deletedAt ? new Date(deletedAt).toLocaleString() : new Date().toLocaleString()}`);
            doc.text(`Deletion Type: ${deletionType || 'user_request'}`);
            doc.moveDown(1);
            // Account Information
doc.fontSize(14).text('Account Information', { underline: true });
doc.moveDown(0.5);

doc.fontSize(10);
doc.text(`Account Created: ${
    user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'
}`);

doc.text(`Total Login Count: ${user?.loginCount ?? 0}`);

doc.text(`Last Login: ${
    user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'
}`);

doc.moveDown(1);

// Login History
doc.fontSize(14).text(`Login History (${loginActivities.length})`, {
    underline: true
});
doc.moveDown(0.5);

doc.fontSize(10);

if (loginActivities.length === 0) {
    doc.text('No login history found.');
} else {
    loginActivities.forEach((login, i) => {
        doc.text(`${i + 1}. ${new Date(login.loginAt).toLocaleString()}`);

        if (doc.y > 700) {
            doc.addPage();
        }
    });
}

doc.moveDown(1);

// Name Change History
doc.fontSize(14).text(`Name Change History (${nameChanges.length})`, {
    underline: true
});
doc.moveDown(0.5);

doc.fontSize(10);

if (nameChanges.length === 0) {
    doc.text('No name changes found.');
} else {
    nameChanges.forEach((change, i) => {
        doc.text(`${i + 1}. ${change.oldName} → ${change.newName}`);
        doc.text(`   Changed At: ${new Date(change.changedAt).toLocaleString()}`);
        doc.moveDown(0.3);

        if (doc.y > 700) {
            doc.addPage();
        }
    });
}

doc.moveDown(1);

            doc.fontSize(14).text(`Personal Notes (${notes.length})`, { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);
            if (notes.length === 0) {
                doc.text('No personal notes found.');
            } else {
                notes.slice(0, 100).forEach((n, i) => {
                    doc.text(`${i + 1}. ${n.title || 'Untitled'} | ${n.time ? new Date(n.time).toLocaleDateString() : ''}`);
                    if (n.description) {
                        doc.text(`   ${n.description.substring(0, 300)}`, { indent: 10 });
                    }
                    doc.moveDown(0.3);
                    if (doc.y > 700) { doc.addPage(); }
                });
            }

            doc.moveDown(1);
            doc.fontSize(14).text(`Sent Notes (${sentNotes.length})`, { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);
            if (sentNotes.length === 0) {
                doc.text('No sent notes.');
            } else {
                sentNotes.slice(0, 100).forEach((n, i) => {
                    doc.text(`${i + 1}. To: ${n.receiverName || n.receiver || 'Unknown'} - ${n.title || ''}`);
                    doc.moveDown(0.2);
                });
            }

            doc.moveDown(1);
            doc.fontSize(14).text(`Received Notes (${receivedNotes.length})`, { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(10);
            if (receivedNotes.length === 0) {
                doc.text('No received notes.');
            } else {
                receivedNotes.slice(0, 100).forEach((n, i) => {
                    doc.text(`${i + 1}. From: ${n.senderName || n.sender || 'Unknown'} - ${n.title || ''}`);
                    doc.moveDown(0.2);
                });
            }

            // --- CONTENT END ---
            // Sab se end me ek hi baar end() call karo
            doc.end();

        } catch (err) {
            console.error("Outer PDF error:", err);
            reject(err);
        }
    });
};

module.exports = generateDeletionPdf;