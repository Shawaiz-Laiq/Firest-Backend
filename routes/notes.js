const express = require('express');
const router = express.Router();
const fectchuser = require("../middleware/fectchuser");
const Note = require('../models/Note');
const { body , validationResult } = require('express-validator');


router.get('/fetchnotes', fectchuser,  async (req , res)=>{
    try{
    const notes = await Note.find({user: req.user.id})
    res.json(notes)
    } catch (error){
        console.error(error.message)
        res.status(500).send({error: "internal server error"})
     }
})

router.post('/addnotes', fectchuser, [
    body('title', "enter a vaild title").isLength({min:10}), 
    body('description', "Description must be 10 dharacters only").isLength({min: 10})
] , async (req , res)=>{
    try{

    const {title, description} = req.body;

    const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()})
        }
    const note = new Note({
        title, description, user: req.user.id
    })   
    const saveNote = await note.save() 
    

    res.json(saveNote)
    } catch (error){
        console.error(error.message)
        res.status(500).send({error: "internal server error"})
    }


})

module.exports = router;