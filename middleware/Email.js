
const { transporter } = require("./Emailconfiq");

const SendVerfication = async (email, verficationC, name) => {
  try {
    const info = await transporter.sendMail({
      from: `"iNotebook" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify Your Email Address | iNotebook",

      text: `Hi ${name},

Welcome to iNotebook!

We're happy to have you on board. To complete your registration, please use the verification code below:

${verficationC}

Enter this code on the verification page to verify your email address.

For your security, don't share this code with anyone.

If you didn't create an iNotebook account, you can safely ignore this email.

Best regards,
The iNotebook Team`,

      html: `
        <div style="margin:0;padding:30px 10px;background-color:#f4f7fb;font-family:Arial,sans-serif;">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

            <div style="background:#2563eb;padding:28px 20px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;">iNotebook</h1>
              <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">
                Your notes, organized in one place
              </p>
            </div>

            <div style="padding:30px 25px;color:#374151;">
              <h2 style="margin-top:0;color:#111827;font-size:22px;">
                Welcome, ${name}! 👋
              </h2>

              <p style="font-size:15px;line-height:1.7;">
                We're excited to have you join iNotebook!
              </p>

              <p style="font-size:15px;line-height:1.7;">
                Just one more step, ${name}. Verify your email address
                using the code below to complete your registration.
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
                Enter this code on the verification page to activate your
                account. For your security, please don't share it with anyone.
              </p>

              <p style="font-size:14px;line-height:1.7;color:#4b5563;">
                If you didn't create an iNotebook account, you can safely
                ignore this email.
              </p>

              <p style="font-size:15px;line-height:1.7;color:#374151;">
                Happy note-taking!<br>
                <strong>The iNotebook Team</strong>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0;">

              <p style="margin-bottom:0;font-size:12px;line-height:1.6;color:#9ca3af;text-align:center;">
                Automated email — please do not reply.
                <br>
                &copy; ${new Date().getFullYear()} iNotebook
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Verification email sent successfully:", info.messageId);
    return { success: true };

  } catch (err) {
    console.error("Verification email error:", err.message);
    return { success: false };
  }

};

const SendPasswordResetEmail = async (email, code, name) => {
  try {
    await transporter.sendMail({
      from: `"iNotebook" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset Your iNotebook Password",
      text: `Hi ${name}, your password reset code is ${code}. It expires in 10 minutes.`,
      html: `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h2>iNotebook Password Reset</h2>
          <p>Hi ${name},</p>
          <p>Use this code to reset your password:</p>
          <h1 style="letter-spacing:8px">${code}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `
    });

    return { success: true };
 } catch (error) {
  console.error("Password reset email error:", error);
  console.error("Email error code:", error.code);
  console.error("Email response:", error.response);

  return { success: false };
}
};

module.exports = {
  SendVerfication,
  SendPasswordResetEmail
};