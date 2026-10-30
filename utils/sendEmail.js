
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
}
});

const sendNoteEmail = async ({ receiverEmail, senderName, title, description }) => {
  return transporter.sendMail({
  from: `"iNotebook" <${process.env.SMTP_USER}>`,
    to: receiverEmail,
    subject: `New note received from ${senderName}`,
    text: `
Hello,

You have received a new note from ${senderName}.

Title: ${title}

Message:
${description}

Please login to your iNotebook account to view your notes.
`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <h2 style="color:#2563eb;">You received a new note!</h2>
        <p>Hello,</p>
        <p><strong>${senderName}</strong> has sent you a new note.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:10px;">
          <h3>${title}</h3>
          <p style="white-space:pre-wrap;">${description}</p>
        </div>
        <p>Please login to your iNotebook account to view your notes.</p>
      </div>
    `
  });
};

module.exports = sendNoteEmail;
