
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const fetchuser = require('../middleware/fectchuser');
const SentNote = require('../models/SentNote');
const Note = require('../models/Note');
const User = require('../models/User');
const SendAttempt = require('../models/SendAttempt');
const sendNoteEmail = require('../utils/sendEmail');


// Helper: active user check
async function getActiveUser(userId) {
  return User.findOne({
    _id: userId,
    isDeleted: { $ne: true }
  }).select('_id name email');
}

// 1. Send a note permanently

router.post('/send/:noteId', fetchuser, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;
    const { noteId } = req.params;

    // Validate note ID
    if (!mongoose.isValidObjectId(noteId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note ID'
      });
    }

    // Find active sender
    const sender = await getActiveUser(senderId);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender account not found'
      });
    }

    // Validate recipient ID
    const validRecipientId = mongoose.isValidObjectId(recipientId);

    const receiver = validRecipientId
      ? await getActiveUser(recipientId)
      : null;

    if (!receiver) {
      await SendAttempt.create({
        sender: sender._id,
        attemptedReceiver: String(recipientId || ''),
        reason: validRecipientId
          ? 'Recipient not found or account deleted'
          : 'Invalid recipient ID'
      });

      return res.status(404).json({
        success: false,
        message: 'Recipient not found or account deleted'
      });
    }

    // Prevent sending note to yourself
    if (sender._id.equals(receiver._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a note to yourself'
      });
    }

    // Find sender's own note
    const note = await Note.findOne({
      _id: noteId,
      user: sender._id
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Your note was not found'
      });
    }

    // Save note in database
    const sentNote = await SentNote.create({
      sender: sender._id,
      receiver: receiver._id,
      senderName: sender.name,
      receiverName: receiver.name,
      originalNoteId: note._id,
      title: note.title,
      description: note.description,
      sentAt: new Date()
    });

    // Send email notification
    try {
      await sendNoteEmail({
        receiverEmail: receiver.email,
        senderName: sender.name,
        title: note.title,
        description: note.description
      });

      console.log('Note notification email sent successfully');

    } catch (emailError) {
      console.error('Note email sending failed:', emailError);
    }

    return res.status(201).json({
      success: true,
      message: 'Note sent successfully',
      sentNote
    });

  } catch (error) {
    console.error('Send note error:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});



// 2. Notes received by the logged-in user
router.get('/received', fetchuser, async (req, res) => {
  try {
    const user = await getActiveUser(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notes = await SentNote.find({
      receiver: user._id,
      sender: {
        $in: await User.find({
          isDeleted: { $ne: true }
        }).distinct('_id')
      }
    }).sort({ sentAt: -1 });

    return res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Received notes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// 3. Notes sent by the logged-in user
router.get('/sent', fetchuser, async (req, res) => {
  try {
    const user = await getActiveUser(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const activeUsers = await User.find({
      isDeleted: { $ne: true }
    }).distinct('_id');
    console.log("Logged in User ID:", user._id);

console.log("Looking for receiver:", user._id.toString());

const testNotes = await SentNote.find({
    receiver: user._id
});

console.log("Received Notes Found:", testNotes.length);

console.log("Received Notes:", testNotes);

    const notes = await SentNote.find({
      sender: user._id,
      receiver: { $in: activeUsers }
    }).sort({ sentAt: -1 });

    return res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Sent notes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


// 4. Automatically find mutual friends
router.get('/friends', fetchuser, async (req, res) => {
  try {
    const user = await getActiveUser(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // People who received a note from me
    const sentTo = await SentNote.distinct('receiver', {
      sender: user._id
    });

    // People who also sent me a note
    const sentBack = await SentNote.distinct('sender', {
      receiver: user._id
    });

    const sentBackSet = new Set(
      sentBack.map(id => id.toString())
    );

    const mutualFriendIds = sentTo.filter(id =>
      sentBackSet.has(id.toString())
    );

    const friends = await User.find({
      _id: { $in: mutualFriendIds },
      isDeleted: { $ne: true }
    }).select('_id name email');

    return res.json({
      success: true,
      friends
    });
  } catch (error) {
    console.error('Friends error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
// Mark sender's received notes as read
router.post("/read/:senderId", fetchuser, async (req, res) => {
  try {
    const user = await getActiveUser(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const { senderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sender ID"
      });
    }

    const result = await SentNote.updateMany(
      {
        receiver: user._id,
        sender: senderId,
        isRead: { $ne: true }
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: "Notes marked as read",
      updated: result.modifiedCount
    });

  } catch (error) {
    console.error("Mark read error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = router;
