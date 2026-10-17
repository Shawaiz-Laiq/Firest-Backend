const jwt = require('jsonwebtoken')
const sec = 'thisisnotimportant';

const fectchuser =(req , res, next)=>{
    const token = req.header('auth-token')
    if(!token) { 
        res.status(401).send({error: "please token"})

    }
    try{
        const data = jwt.verify(token, sec);
        req.user = data.user; 
        next()
    }catch (error){
        res.status(401).send({error: "please token 3"})
     }

}
module.exports = fectchuser;