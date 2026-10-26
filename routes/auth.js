const express = require('express');

const User = require('../models/User');
const router = express.Router();
const { body , validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sec = 'thisisnotimportant';
const fectchuser = require("../middleware/fectchuser");




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
    let existingName = await User.findOne({ name: req.body.name });
    if(user && existingName){
        return res.status(400).json({errors : "acoount already exists , This name is already taken"})
    }
    if(user){
        return res.status(400).json({errors : "acoount already exists"})
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
        email : req.body.email,
        password : secPass,
    })
    const data = {
        user:{
            id: user.id
        }
    }
    const jwtdata = jwt.sign(data, sec);
    console.log(jwtdata)
    res.json({jwtdata})

    // res.json(user) 
    } catch(error) {
        console.error(error.message);
        res.status(500).send("ye kya howa")
    }
   
})

router.post('/login', [
    body('email', "enter a vaild email").isEmail(), 
    // body('name', "Enter a vaild name").isLength({min: 3}),
    body('password', "password must 3 digits long").exists(),
], async (req , res) => {
 const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()})
}
const {email, password} = req.body
try{
    let user = await User.findOne({email});
    if(!user) {
         success = false
        return res.status(400).json({success, error: "please try to login with corrcet credentials"})
    }
    const passwordC = await bcrypt.compare(password, user.password)
    if (!passwordC) {
        success = false
          return res.status(400).json({success, error: "please try to login with corrcet credentials"})
    }
    const data ={
        user: {
            id: user.id
        }
    }
     const jwtdata = jwt.sign(data, sec);
    success = true
     res.json({success,jwtdata})
} catch (error) { 
    console.error(error.message);
    res.status(500).send("server error")
}
}) 







router.post('/getuser', fectchuser , async (req , res)=>{

try {
    userId = req.user.id
    const user = await User.findById(userId).select("-password")
    res.send(user)
} catch (error) {
    console.error(error.message);
    res.status(500).send("server error")
}
})


module.exports = router;
