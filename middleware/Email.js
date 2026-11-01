
const { transporter } = require("./Emailconfiq");
const EmailLog = require("../models/EmailLog");

// Save email history in MongoDB
const saveEmailLog = async ({
  email,
  type,
  status,
  messageId = null,
  error = null,
  userId = null
}) => {
  try {
    await EmailLog.create({
      email: email.trim().toLowerCase(),
      type,
      status,
      messageId,
      error,
      userId
    });
  } catch (logError) {
    // Logging failure should not break the email process
    console.error("Email log save failed:", logError.message);
  }
};

// Send verification email
const SendVerfication = async (
  email,
  verficationC,
  name,
  userId = null
) => {
  try {
    const info = await transporter.sendMail({
      from: `"iNotebook" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify Your Email Address | iNotebook",

      text: `Hi ${name},

Welcome to iNotebook!

Your verification code is: ${verficationC}

Enter this code on the verification page to verify your email address.

For your security, don't share this code with anyone.

If you didn't create an iNotebook account, you can ignore this email.

Best regards,
The iNotebook Team`,

      html: `
        <div style="margin:0;padding:30px 10px;background:#f4f7fb;font-family:Arial,sans-serif;">
          <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            
            <div style="background:#2563eb;padding:28px 20px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;">iNotebook</h1>
              <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">
                Your notes, organized in one place
              </p>
            </div>

            <div style="padding:30px 25px;color:#374151;">
              <h2 style="margin-top:0;color:#111827;font-size:22px;">
                Welcome, ${name}!
              </h2>

              <p style="font-size:15px;line-height:1.7;">
                We're excited to have you join iNotebook!
              </p>

              <p style="font-size:15px;line-height:1.7;">
                Verify your email address using the code below.
              </p>

              <div style="margin:28px 0;padding:20px;background:#eff6ff;border:1px dashed #93c5fd;border-radius:8px;text-align:center;">
                <p style="margin:0 0 10px;color:#4b5563;font-size:13px;">
                  YOUR VERIFICATION CODE
                </p>
                <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;overflow-wrap:anywhere;">
                  ${verficationC}
                </div>
              </div>

              <p style="font-size:14px;line-height:1.7;color:#4b5563;">
                For your security, please don't share this code with anyone.
              </p>

              <p style="font-size:14px;line-height:1.7;color:#4b5563;">
                If you didn't create an iNotebook account, you can ignore this email.
              </p>

              <p style="font-size:15px;line-height:1.7;">
                Happy note-taking!<br>
                <strong>The iNotebook Team</strong>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0;">

              <p style="font-size:12px;color:#9ca3af;text-align:center;">
                Automated email — please do not reply.<br>
                &copy; ${new Date().getFullYear()} iNotebook
              </p>
            </div>
          </div>
        </div>
      `
    });

    await saveEmailLog({
      email,
      type: "verification",
      status: "sent",
      messageId: info.messageId,
      userId
    });

    console.log("Verification email sent successfully:", info.messageId);

    return { success: true };

  } catch (err) {
    console.error("Verification email error:", err.message);

    await saveEmailLog({
      email,
      type: "verification",
      status: "failed",
      error: err.message,
      userId
    });

    return {
      success: false,
      error: err.message
    };
  }
};

// Send password-reset email
const SendPasswordResetEmail = async (
  email,
  code,
  name,
  userId = null
) => {
  try {
    const info = await transporter.sendMail({
      from: `"iNotebook" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset Your iNotebook Password",

      text: `Hi ${name},

Your iNotebook password reset code is: ${code}

This code expires in 10 minutes.

If you did not request this, please ignore this email.`,

      html: `
        <div style="font-family:Arial,sans-serif;padding:24px;background:#f4f7fb;">
          <div style="max-width:520px;margin:auto;background:#fff;padding:25px;border-radius:12px;">
            <h2 style="color:#2563eb;">iNotebook Password Reset</h2>
            <p>Hi ${name},</p>
            <p>Your password reset code is:</p>

            <div style="padding:20px;background:#eff6ff;text-align:center;border-radius:8px;">
              <h1 style="letter-spacing:8px;color:#1d4ed8;">${code}</h1>
            </div>

            <p>This code expires in 10 minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;">
            <p style="font-size:12px;color:#9ca3af;text-align:center;">
              Automated email — please do not reply.
            </p>
          </div>
        </div>
      `
    });

    await saveEmailLog({
      email,
      type: "password-reset",
      status: "sent",
      messageId: info.messageId,
      userId
    });

    console.log("Password reset email sent successfully:", info.messageId);

    return { success: true };

  } catch (error) {
    console.error("Password reset email error:", error.message);
    console.error("SMTP error code:", error.code || "N/A");
    console.error("SMTP response:", error.response || "N/A");

    await saveEmailLog({
      email,
      type: "password-reset",
      status: "failed",
      error: error.message,
      userId
    });

    return {
      success: false,
      error: error.message,
      code: error.code || null
    };
  }
};
const SendAccountDeletionEmail = async ({
    email,
    name,
    deletionType,
    downloadUrl,
    userId = null
}) => {
    try {
        const isSelfDeleted = deletionType === "self-deleted";

        const subject = isSelfDeleted
            ? "Your iNotebook Account Has Been Deleted"
            : "Your iNotebook Account Was Deleted by Admin";

        const message = isSelfDeleted
            ? "You requested the deletion of your iNotebook account."
            : "Your iNotebook account was deleted by an administrator.";

        const mail = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject,

            text: `
Hello ${name},

${message}

Your personal data archive is available through the secure link below:

${downloadUrl}

This download link will expire after 30 days.

Regards,
iNotebook Team
            `,

            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>iNotebook Account Deletion</h2>

                    <p>Hello ${name},</p>

                    <p>${message}</p>

                    <p>
                        Your personal data archive is available
                        through the secure link below.
                    </p>

                    <a href="${downloadUrl}"
                       style="display:inline-block;
                       padding:12px 20px;
                       background:#2563eb;
                       color:white;
                       text-decoration:none;
                       border-radius:6px;">
                       Download My Data Archive
                    </a>

                    <p>This secure download link expires after 30 days.</p>

                    <p>Regards,<br>iNotebook Team</p>
                </div>
            `
        });

        await saveEmailLog({
            email,
            type: isSelfDeleted
                ? "account-deletion-self"
                : "account-deletion-admin",
            status: "sent",
            messageId: mail.messageId,
            userId
        });

        return { success: true };

    } catch (error) {
        console.error("Account deletion email error:", error);

        await saveEmailLog({
            email,
            type: deletionType === "self-deleted"
                ? "account-deletion-self"
                : "account-deletion-admin",
            status: "failed",
            error: error.message,
            userId
        });

        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    SendPasswordResetEmail,
    SendVerfication,
    SendAccountDeletionEmail
};
