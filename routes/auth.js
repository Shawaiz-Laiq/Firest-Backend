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
    })
    const data = {
      user: {
        id: user.id
      }
    }
    const jwtdata = jwt.sign(data, sec);
    console.log(jwtdata)
    res.json({ jwtdata })

    // res.json(user) 
  } catch (error) {
    console.error(error.message);
    res.status(500).send("ye kya howa")
  }

})

router.post('/login', [
  body('email', "enter a vaild email").isEmail(),
  // body('name', "Enter a vaild name").isLength({min: 3}),
  body('password', "password must 3 digits long").exists(),
], async (req, res) => {
  let success = false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const { email, password } = req.body
  try {
    let user = await User.findOne({ email });
    if (!user) {
      success = false
      return res.status(400).json({ success, error: "please try to login with corrcet credentials" })
    }
    const passwordC = await bcrypt.compare(password, user.password)
    if (!passwordC) {
      success = false
      return res.status(400).json({ success, error: "please try to login with corrcet credentials" })
    }
    const data = {
      user: {
        id: user.id
      }
    }
    const jwtdata = jwt.sign(data, sec);
    success = true


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

    res.json({ success, jwtdata })
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error")
  }
})

router.delete('/delete-account', fectchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role === 'admin') {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Account moved to Deleted Users'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});


// Move user to Deleted Users
router.delete('/admin/delete-user/:id', fectchuser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const user = await User.findOne({
      _id: req.params.id,
      role: 'user',
      isDeleted: false
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.json({ success: true, message: 'User moved to Deleted Users' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});


// Restore user
router.put('/admin/restore-user/:id', fectchuser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const user = await User.findOne({
      _id: req.params.id,
      role: 'user',
      isDeleted: true
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Deleted user not found' });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();

    res.json({ success: true, message: 'User restored successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
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
      user: user._id
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
      totalUsers,
      onlineUsers,
      loginEvents24h,
      uniqueUsers24h
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        lastSeen: { $gte: onlineCutoff }
      }),

      LoginActivity.countDocuments({
        loginAt: { $gte: last24Hours, $lte: now }
      }),

      LoginActivity.distinct('user', {
        loginAt: { $gte: last24Hours, $lte: now }
      })
    ]);

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
      role: 'user'
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
    const allUsers = await User.find({ role: 'user' })
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
      notesByUser
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});



module.exports = router;
