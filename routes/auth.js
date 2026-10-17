const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body , validationResult } = require('express-validator')
const bcrypt = require('bcryptjs');




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
    const salt = await bcrypt.genSalt(10);

    const secPass = await bcrypt.hash(req.body.password, salt);
    user = await User.create({
        name: req.body.name,
        email : req.body.email,
        password : secPass,
    })
    res.json(user) } catch(error) {
        console.error(error.message);
        res.status(500).send("ye kya howa")
    }
   
})
module.exports = router;
