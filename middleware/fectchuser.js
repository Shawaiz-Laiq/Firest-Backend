
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sec = 'thisisnotimportant';

const fectchuser = async (req, res, next) => {
    const token = req.header('auth-token');

    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Please provide token"
        });
    }

    let data;

    // Step 1: Verify JWT
    try {
        data = jwt.verify(token, sec);
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: "Invalid or expired token"
        });
    }

    try {
        // Step 2: Check whether account still exists
        const user = await User.findById(data.user?.id)
            .select('_id role isDeleted');

        // Deleted account or inactive account
        if (!user || user.isDeleted === true) {
            return res.status(401).json({
                success: false,
                code: "ACCOUNT_UNAVAILABLE",
                error: "Your account is no longer active. Please log in again."
            });
        }

        // Step 3: Attach verified user information
        req.user = {
            id: user._id.toString(),
            role: user.role
        };

        next();

    } catch (error) {
        console.error("Authentication middleware error:", error);

        return res.status(500).json({
            success: false,
            error: "Authentication server error"
        });
    }
};

module.exports = fectchuser;
