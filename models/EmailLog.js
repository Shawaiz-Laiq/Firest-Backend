
const mongoose = require("mongoose");

const EmailLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    type: {
      type: String,
      enum: ["verification", "password-reset"],
      required: true
    },

    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true
    },

    messageId: {
      type: String,
      default: null
    },

    error: {
      type: String,
      default: null
    },

    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

EmailLogSchema.index({ email: 1, sentAt: -1 });

module.exports =
  mongoose.models.EmailLog ||
  mongoose.model("EmailLog", EmailLogSchema);
