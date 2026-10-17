const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body , validationResult } = require('express-validator')




router.post('/createuser', [
    body('email', "enter a vaild email").isEmail(), 
    body('name', "Enter a vaild name").isLength({min: 3}),
    body('password', "password must 3 digits long").isLength({min: 3})
], async (req , res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()})
    }
    try{
    let user = await User.findOne({email: req.body.email});
    if(user){
        return res.status(400).json({errors : "acoount already exists"})
    }
    user = await User.create({
        name: req.body.name,
        email : req.body.email,
        password : req.body.password,
    })
    res.json(user) } catch(error) {
        console.error(error.message);
        res.status(500).send("ye kya howa")
    }
   
})
module.exports = router;
