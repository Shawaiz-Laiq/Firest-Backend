
const jwt = require('jsonwebtoken');
const sec = 'thisisnotimportant';

const fectchuser = (req, res, next) => {
    const token = req.header('auth-token');

    if (!token) {
        return res.status(401).send({
            error: "Please provide token"
        });
    }

    try {
        const data = jwt.verify(token, sec);
        req.user = data.user;
        // res.send({
        //     result: "success"
        // })
        next();
    } catch (error) {
        return res.status(401).send({
            error: "Please provide a valid token"
        });
    }
};

module.exports = fectchuser;
