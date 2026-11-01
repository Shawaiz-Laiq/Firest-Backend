const mongoose = require("mongoose");

const uploadDeletionPdf = async (pdfBuffer, filename) => {
    try {
        console.log("Starting PDF upload, buffer size:", pdfBuffer?.length);

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error("PDF buffer is empty");
        }

        // Mongoose 9 fix - connection ready check
        if (mongoose.connection.readyState !== 1) {
            console.log("Mongo not ready, readyState:", mongoose.connection.readyState);
            throw new Error("MongoDB not connected");
        }

        const db = mongoose.connection.db;
        console.log("DB object:", db ? "OK" : "NULL");
        
        if (!db) {
            throw new Error("DB is null");
        }

        // Mongoose 9 me ye sahi tareeqa hai
        const { GridFSBucket } = require('mongodb');
        const bucket = new GridFSBucket(db, {
            bucketName: "deletedUserPdfs"
        });

        console.log("GridFSBucket created, uploading:", filename);

        // FIX: direct end() use karo, Readable mat use karo
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: "application/pdf",
            metadata: { uploadedAt: new Date() }
        });

        const fileId = await new Promise((resolve, reject) => {
            uploadStream.on('error', (err) => {
                console.error("UploadStream error:", err);
                reject(err);
            });
            uploadStream.on('finish', () => {
                console.log("Upload finished, fileId:", uploadStream.id);
                resolve(uploadStream.id);
            });
            // Ye sab se important fix hai
            uploadStream.end(pdfBuffer);
        });

        return fileId;

    } catch (error) {
        console.error("=== PDF UPLOAD FAILED ===");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
        return null;
    }
};

module.exports = uploadDeletionPdf;