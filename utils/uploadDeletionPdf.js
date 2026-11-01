const mongoose = require("mongoose");
const { Readable } = require("stream");

const uploadDeletionPdf = async (pdfBuffer, filename) => {
    try {
        const db = mongoose.connection.db;

        if (!db) {
            throw new Error("MongoDB connection is not ready");
        }

        const bucket = new mongoose.mongo.GridFSBucket(db, {
            bucketName: "deletedUserPdfs"
        });

        return await new Promise((resolve, reject) => {
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: "application/pdf"
            });

            uploadStream.on("finish", () => {
                resolve(uploadStream.id);
            });

            uploadStream.on("error", reject);

            Readable.from([pdfBuffer]).pipe(uploadStream);
        });

    } catch (error) {
        console.error("PDF upload error:", error);
        throw error;
    }
};

module.exports = uploadDeletionPdf;