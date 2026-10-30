const express = require('express');

const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sec = 'thisisnotimportant';
const fectchuser = require("../middleware/fectchuser");
const LoginActivity = require('../models/LoginActivity');
const NoteActivity = require('../models/NoteActivity');
const Note = require('../models/Note');
const DeletedUser = require('../models/DeletedUser');
const NoteHistory = require('../models/NoteHistory');
const {SendVerfication} = require("../middleware/Email");
const crypto = require("crypto");
const { SendPasswordResetEmail } = require("../middleware/Email");
const SentNote = require('../models/SentNote');
const SendAttempt = require('../models/SendAttempt');






router.post('/createuser', [
  body('email', "enter a vaild email").isEmail(),
  body('name', "Enter a vaild name").isLength({ min: 3 }),
  body('password', "password must 3 digits long").isLength({ min: 3 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  try {
    let user = await User.findOne({ email: req.body.email });
    let existingName = await User.findOne({ name: req.body.name });
    const verficationCode = Math.floor(100000 + Math.random()* 900000).toString()
    if (user && existingName) {
      return res.status(400).json({ errors: "acoount already exists , This name is already taken" })
    }
    if (user) {
      return res.status(400).json({ errors: "acoount already exists" })
    }

    if (existingName) {
      return res.status(400).json({
        errors: "This name is already taken"
      });
    }
    const salt = await bcrypt.genSalt(10);

    const secPass = await bcrypt.hash(req.body.password, salt);
    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: secPass,
      verficationCode
    })
   await SendVerfication(
  user.email,
  verficationCode,
  user.name,
  user._id
);
  return res.status(201).json({
  success: true,
  message: "Account created. Please verify your email."
});
    const jwtdata = jwt.sign(data, sec);
    console.log(jwtdata)
    res.json({ jwtdata })

    // res.json(user) 
  } catch (error) {
    console.error(error.message);
    res.status(500).send("error")
  }

})


router.post("/verify-email", async (req, res) => {
  try {
    const { email, verficationCode } = req.body;

    if (!email || !verficationCode) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required."
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found."
      });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: "Your email is already verified."
      });
    }

    if (user.verficationCode !== verficationCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code. Please try again."
      });
    }

    user.isVerified = true;
    user.verficationCode = undefined;

    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully! You can now log in."
    });

  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again."
    });
  }
});



router.post('/login', [
  body('email', "enter a valid email").isEmail(),
  body('password', "password is required").exists(),
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Please try to login with correct credentials"
      });
    }

    const passwordC = await bcrypt.compare(password, user.password);

    if (!passwordC) {
      return res.status(400).json({
        success: false,
        error: "Please try to login with correct credentials"
      });
    }

    // IMPORTANT: Email verification check
    if (user.isVerified !== true) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: user.email,
        message: "Please verify your email before logging in."
      });
    }

    // Verified user ke liye hi JWT generate hoga
    const data = {
      user: {
        id: user.id
      }
    };

    const jwtdata = jwt.sign(data, sec);

    user.lastLogin = new Date();
    user.lastSeen = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    await user.save();

    await LoginActivity.create({
      user: user._id
    });

    console.log("LOGIN ACTIVITY SAVED FOR:", user.email);

    const activityCount = await LoginActivity.countDocuments();
    console.log("TOTAL LOGIN ACTIVITIES:", activityCount);

    return res.json({
      success: true,
      jwtdata
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});


  

router.post("/forgot-password", async (req, res) => {
 

  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    // 1. Database mein account check karo
  
const user = await User.findOne({ email });

// 1. Account exist nahi karta
// if (user.isVerified === true) {
//   return res.json({
//     success: true,
//     message:
//       "If an active account exists for this email, a reset code will be sent verfication par."
//   });
// }

// 2. Account deleted ya inactive hai
if (user.isDeleted === true) {
  return res.json({
    success: true,
    message:
      "If an active account exists for this email, a reset code will be sent delete par."
  });
}

// 3. Account active hai — ab reset code generate karo
const code = crypto.randomInt(100000, 1000000).toString();


    user.resetPasswordCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    // 4. Sirf database mein mile hue account ko email bhejo
   const result = await SendPasswordResetEmail(
  user.email,
  code,
  user.name,
  user._id
);
console.log("Email send result:", result);
    // 5. Email fail ho to reset code clear karo
    
if (!result || !result.success) {
  console.error("Forgot password failed at: SendPasswordResetEmail");
  console.error("Email service error:", result?.error || result?.message || "Unknown email error");

  user.resetPasswordCode = null;
  user.resetPasswordExpires = null;
  await user.save();

  return res.status(500).json({
    success: false,
    stage: "send_password_reset_email",
    message: "Unable to send the reset email.",
    reason: result?.error || result?.message || "Email service failed. Check Vercel Runtime Logs."
  });
}

    return res.json({
      success: true,
     
    });

  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again."
    });
  }
});




  router.post("/reset-password", async (req, res) => {
    try {
      const email = req.body.email?.trim().toLowerCase();
      const code = String(req.body.code || "").trim();
      const { newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Email, code and new password are required."
        });
      }

      if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 6-digit code."
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters long."
        });
      }

      const user = await User.findOne({ email });

      if (
        !user ||
        !user.resetPasswordCode ||
        !user.resetPasswordExpires ||
        user.resetPasswordExpires.getTime() <= Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset code. Request a new one."
        });
      }

      const submittedHash = crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");

      if (submittedHash !== user.resetPasswordCode) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset code. Request a new one."
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      // OTP is single-use
      user.resetPasswordCode = null;
      user.resetPasswordExpires = null;

      await user.save();

      return res.json({
        success: true,
        message: "Password reset successfully. Please log in."
      });
    } catch (error) {
      console.error("Reset password error:", error);

      return res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again."
      });
    }
  });




router.delete('/delete-account', fectchuser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || user.role === 'admin') {
            return res.status(404).json({
                success: false,
                error: 'Account not found'
            });
        }

        // Save account in DeletedUser collection first
        const deletedUser = new DeletedUser({
            originalUserId: user._id,
            name: user.name,
            email: user.email,
            password: user.password, // Existing hashed password
            role: user.role,
            lastLogin: user.lastLogin,
            lastSeen: user.lastSeen,
            loginCount: user.loginCount,
            time: user.time,
            createdAt: user.createdAt,
            deletedAt: new Date()
        });

        await deletedUser.save();

        // Remove original account from Users
        const result = await User.deleteOne({
            _id: user._id
        });

        // Roll back archive if original account was not deleted
        if (result.deletedCount !== 1) {
            await DeletedUser.deleteOne({
                _id: deletedUser._id
            });

            return res.status(500).json({
                success: false,
                error: 'Account could not be deleted. Please try again.'
            });
        }

        return res.json({
            success: true,
            message: 'Your account has been deleted successfully.'
        });

    } catch (error) {
        console.error('Delete account error:', error);

        return res.status(500).json({
            success: false,
            error: 'Server error while deleting account.'
        });
    }
});



// Move user to Deleted Users
router.delete('/admin/delete-user/:id', fectchuser, async (req, res) => {
    try {
        const admin = await User.findById(req.user.id);

        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const user = await User.findOne({
            _id: req.params.id,
            role: 'user',
            isDeleted: { $ne: true }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Save user in DeletedUser collection first
        const deletedUser = new DeletedUser({
            originalUserId: user._id,
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role,
            lastLogin: user.lastLogin,
            lastSeen: user.lastSeen,
            loginCount: user.loginCount,
            time: user.time,
            createdAt: user.createdAt,
            deletedAt: new Date()
        });

       await deletedUser.save();

const result = await User.deleteOne({ _id: user._id });

if (result.deletedCount !== 1) {
    await DeletedUser.deleteOne({ _id: deletedUser._id });

    return res.status(500).json({
        success: false,
        error: 'User could not be removed from Users'
    });
}

        res.json({
            success: true,
            message: 'User moved to Deleted Users collection'
        });

    } catch (error) {
        console.error('Delete user error:', error);

        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
});


// Restore user

router.put('/admin/restore-user/:id', fectchuser, async (req, res) => {
    try {
        // Verify admin
        const admin = await User.findById(req.user.id);

        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        // Find archived account
        const deletedUser = await DeletedUser.findById(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                error: 'Deleted user not found'
            });
        }

        // Check if the email is already registered
        const existingUser = await User.findOne({
            email: deletedUser.email
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'This email is already registered to another account. The deleted account cannot be restored until the email conflict is resolved.'
            });
        }

        // Restore the original account
        const restoredUser = new User({
            name: deletedUser.name,
            email: deletedUser.email,
            password: deletedUser.password,
            role: deletedUser.role,
            lastLogin: deletedUser.lastLogin,
            lastSeen: deletedUser.lastSeen,
            loginCount: deletedUser.loginCount,
            time: deletedUser.time,
            createdAt: deletedUser.createdAt
        });

        await restoredUser.save();

        // Remove archive only after successful restore
        await DeletedUser.deleteOne({ _id: deletedUser._id });

        return res.json({
            success: true,
            message: 'User account restored successfully.'
        });

    } catch (error) {
        console.error('Restore user error:', error);

        // MongoDB duplicate-key protection
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'This email is already registered. The account could not be restored.'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Server error while restoring user.'
        });
    }
});




router.post('/getuser', fectchuser, async (req, res) => {

  try {
    userId = req.user.id
    const user = await User.findById(userId).select("-password")
    res.send(user)
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error")
  }
})


/* ADMIN LOGIN */
router.post('/admin/login', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        error: 'Admin credentials are incorrect'
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Admin credentials are incorrect'
      });
    }

    const data = {
      user: {
        id: user.id
      }
    };
    user.lastLogin = new Date();
    user.lastSeen = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    await user.save();

    await LoginActivity.create({
  user: user._id,
  loginAt: new Date()
});

    const jwtdata = jwt.sign(data, sec);

    return res.json({
      success: true,
      jwtdata
    });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.post('/heartbeat', fectchuser, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      lastSeen: new Date()
    });

    return res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ success: false });
  }
});


/* ADMIN DASHBOARD STATS */
router.get('/admin/stats', fectchuser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('role');

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const onlineCutoff = new Date(now.getTime() - 2 * 60 * 1000);
    const lastMonth = new Date(now);
    lastMonth.setDate(lastMonth.getDate() - 30);

    const [
  onlineUsers,
  loginEvents24h,
  uniqueUserIds24h
] = await Promise.all([
  // Users active within the last 2 minutes
  User.countDocuments({
    role: 'user',
    isDeleted: { $ne: true },
    lastSeen: { $gte: onlineCutoff, $lte: now }
  }),

  // Successful login events during the last 24 hours
  LoginActivity.countDocuments({
    loginAt: { $gte: last24Hours, $lte: now }
  }),

  // Distinct users who logged in during the last 24 hours
  LoginActivity.distinct('user', {
    loginAt: { $gte: last24Hours, $lte: now }
  })
]);

const uniqueUsers24h = uniqueUserIds24h.length;

    const recentLogins = await LoginActivity.aggregate([
      {
        $match: {
          loginAt: { $gte: last24Hours, $lte: now }
        }
      },
      { $sort: { loginAt: -1 } },
      {
        $group: {
          _id: '$user',
          loginAt: { $first: '$loginAt' }
        }
      },
      {
        $lookup: {
          from: User.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.role': 'user' } },
      { $sort: { loginAt: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          name: '$user.name',
          email: '$user.email',
          role: '$user.role',
          loginAt: 1
        }
      }
    ]);

    const loginCountsByUser = await LoginActivity.aggregate([
      {
        $match: {
          loginAt: { $gte: last24Hours, $lte: now }
        }
      },
      {
        $group: {
          _id: '$user',
          loginCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: User.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $match: {
          'user.role': 'user'
        }
      },
      {
        $project: {
          _id: 0,
          name: '$user.name',
          email: '$user.email',
          loginCount: 1
        }
      },
      {
        $sort: {
          loginCount: -1,
          name: 1
        }
      }
    ]);
    const noteCountsByUser = await NoteActivity.aggregate([
      {
        $match: {
          activityAt: { $gte: last24Hours, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            user: '$user',
            action: '$action'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.user',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count'
            }
          }
        }
      },
      {
        $lookup: {
          from: User.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.role': 'user' } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          notesCreated: {
            $let: {
              vars: {
                item: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$actions',
                        as: 'a',
                        cond: { $eq: ['$$a.action', 'create'] }
                      }
                    },
                    0
                  ]
                }
              },
              in: { $ifNull: ['$$item.count', 0] }
            }
          },
          notesEdited: {
            $let: {
              vars: {
                item: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$actions',
                        as: 'a',
                        cond: { $eq: ['$$a.action', 'edit'] }
                      }
                    },
                    0
                  ]
                }
              },
              in: { $ifNull: ['$$item.count', 0] }
            }
          },
          notesDeleted: {
            $let: {
              vars: {
                item: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$actions',
                        as: 'a',
                        cond: { $eq: ['$$a.action', 'delete'] }
                      }
                    },
                    0
                  ]
                }
              },
              in: { $ifNull: ['$$item.count', 0] }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);
    // Total registered users (normal users only)
    const totalRegisteredUsers = await User.countDocuments({
  role: 'user',
  isDeleted: { $ne: true }
});

    // Users registered in the last 24 hours
    const newUsers24h = await User.countDocuments({
      role: 'user',
      time: { $gte: last24Hours, $lte: now }
    });

    // Users registered in the last 30 days
    const newUsersMonth = await User.countDocuments({
      role: 'user',
      time: { $gte: lastMonth, $lte: now }
    });

    // All users with registration and last-login details
    const allUsers = await User.find({
  role: 'user',
  isDeleted: { $ne: true }
})
  .select('name email time lastLogin')
  .sort({ time: -1 })
  .lean();

    // Total notes in the database
    const totalNotes = await Note.countDocuments();

    // Notes created in the last 24 hours
    const newNotes24h = await Note.countDocuments({
      time: { $gte: last24Hours, $lte: now }
    });

    // Notes created in the last 30 days
    const newNotesMonth = await Note.countDocuments({
      time: { $gte: lastMonth, $lte: now }
    });

    // Total notes per user and their latest note date
    const notesByUser = await Note.aggregate([
      {
        $group: {
          _id: '$user',
          totalNotes: { $sum: 1 },
          lastNoteAdded: { $max: '$time' }
        }
      },
      {
        $lookup: {
          from: User.collection.name,
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.role': 'user' } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalNotes: 1,
          lastNoteAdded: 1
        }
      },
      { $sort: { totalNotes: -1 } }
    ]);
    const deletedUsers = await DeletedUser.find()
    .select('-password')
    .sort({ deletedAt: -1 })
    .lean();
   const totalUsers = await User.find({
  role: 'user',
  isDeleted: { $ne: true }
})
  .select('name email time lastLogin lastSeen role')
  .lean();
  



    return res.json({
      success: true,

      // Existing dashboard data
      totalUsers,
      onlineUsers,
      loginEvents24h,
      uniqueUsers24h: uniqueUsers24h.length,
      recentLogins,
      loginCountsByUser,
      noteCountsByUser,

      // New user-management data
      totalRegisteredUsers,
      newUsers24h,
      newUsersMonth,
      allUsers,

      // New notes-management data
      totalNotes,
      newNotes24h,
      newNotesMonth,
      notesByUser,

      //delete 
       deletedUsers
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});



/* ADMIN EMAIL HISTORY */
router.get('/admin/email-history', fectchuser, async (req, res) => {
  try {
    // 1. Check whether the logged-in user is an admin
    const admin = await User.findById(req.user.id).select('role');

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // 2. Read pagination parameters
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    // 3. Fetch email history
    const EmailLog = require('../models/EmailLog');

    const [emails, totalEmails] = await Promise.all([
      EmailLog.find()
        .sort({ sentAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),

      EmailLog.countDocuments()
    ]);

    // 4. Return history and summary
    const summary = await EmailLog.aggregate([
      {
        $group: {
          _id: {
            type: '$type',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      success: true,
      totalEmails,
      page,
      limit,
      totalPages: Math.ceil(totalEmails / limit),
      summary,
      emails
    });

  } catch (error) {
    console.error('Admin email history error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch email history'
    });
  }
});



router.get('/admin/notes-history', fectchuser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('role');

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const activeNotes = await Note.find()
      .populate('user', 'name')
      .sort({ time: -1 })
      .lean();

    const deletedNotes = await NoteHistory.find({
      status: 'deleted'
    })
      .sort({ deletedAt: -1 })
      .lean();

    const activeHistory = activeNotes.map(note => ({
      id: note._id,
      title: note.title,
      description: note.description,
      username: note.user?.name || 'Unknown',
      createdAt: note.time,
      deletedAt: null,
      status: 'active'
    }));

    const deletedHistory = deletedNotes.map(note => ({
      id: note.originalNoteId,
      title: note.title,
      description: note.description,
      username: note.username || 'Unknown',
      createdAt: note.createdAt,
      deletedAt: note.deletedAt,
      status: 'deleted'
    }));

    const notes = [...activeHistory, ...deletedHistory]
      .sort((a, b) =>
        new Date(b.deletedAt || b.createdAt) -
        new Date(a.deletedAt || a.createdAt)
      );

    return res.json({
      success: true,
      totalNotes: notes.length,
      activeNotes: activeHistory.length,
      deletedNotes: deletedHistory.length,
      notes
    });
  } catch (error) {
    console.error('Notes history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});




router.get('/find-user', fectchuser, async (req, res) => {
  try {
    const query = req.query.query?.trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Search input se spaces remove karo
    const search = query.replace(/\s+/g, '');

    const users = await User.find({
      _id: { $ne: req.user.id },
      isDeleted: { $ne: true },
      $or: [
        { name: { $regex: search.split('').join('\\s*'), $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id name email').limit(10);

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      user: users[0],
      users
    });

  } catch (error) {
    console.error('Find user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



/* ADMIN SEND & RECEIVE NOTES HISTORY */
router.get('/admin/sendnotes-history', fectchuser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('role');

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );

    const [notes, totalNotes] = await Promise.all([
      SentNote.find()
        .sort({ sentAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      SentNote.countDocuments()
    ]);

    const [totalSent, totalReceived, totalRead, totalUnread] =
      await Promise.all([
        SentNote.countDocuments(),
        SentNote.countDocuments(),
        SentNote.countDocuments({ isRead: true }),
        SentNote.countDocuments({ isRead: { $ne: true } })
      ]);

    return res.json({
      success: true,
      totalNotes,
      totalSent,
      totalReceived,
      totalRead,
      totalUnread,
      page,
      limit,
      totalPages: Math.ceil(totalNotes / limit),
      notes: notes.map(note => ({
        _id: note._id,
        sender: note.sender,
        senderName: note.senderName,
        receiver: note.receiver,
        receiverName: note.receiverName,
        title: note.title,
        description: note.description,
        sentAt: note.sentAt,
        isRead: note.isRead,
        readAt: note.readAt,
        status: note.isRead ? 'Read' : 'Unread'
      }))
    });

  } catch (error) {
    console.error('Admin send notes history error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to fetch send notes history'
    });
  }
});

router.get('/admin/send-attempts', fectchuser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select('role');

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const attempts = await SendAttempt.find()
      .populate('sender', 'name email')
      .sort({ attemptedAt: -1 })
      .lean();

    return res.json({
      success: true,
      totalAttempts: attempts.length,
      attempts
    });

  } catch (error) {
    console.error('Send attempts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

