const express = require('express');
const router = express.Router();
const fectchuser = require("../middleware/fectchuser");
const Note = require('../models/Note');
const { body, validationResult } = require('express-validator');
const NoteActivity = require('../models/NoteActivity');


router.get('/fetchnotes', fectchuser, async (req, res) => {
    try {
        // const notes = await Note.find({user: req.user.id})
        const notes = await Note.find({ user: req.user.id }).sort({ _id: -1 });
        res.json(notes)
    } catch (error) {
        console.error(error.message)
        res.status(500).send({ error: "internal server error" })
    }
})

router.post('/addnotes', fectchuser, [
    body('title', "enter a vaild title").isLength({ min: 3 }),
    body('description', "Description must be 10 dharacters only").isLength({ min: 10 })
], async (req, res) => {
    try {

        const { title, description } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }
        const note = new Note({
            title, description, user: req.user.id
        })
        const saveNote = await note.save()
        await NoteActivity.create({
            user: req.user.id,
            action: 'create',
            noteTitle: saveNote.title
        });


        res.json(saveNote)
    } catch (error) {
        console.error(error.message)
        res.status(500).send({ error: "internal server error" })
    }



})

router.put('/updatenote/:id', fectchuser, [
    body('title', "enter a vaild title").isLength({ min: 3 }),
    body('description', "Description must be 10 dharacters only").isLength({ min: 10 })
], async (req, res) => {
    const { title, description } = req.body;
    try {

        const newNote = {};
        // if(title){newNote.title = title}
        // if(title){newNote. description =   description}
        if (title) newNote.title = title;
        if (description) newNote.description = description;
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("note found") };

        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("not allow")
        }

        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { returnDocument: 'after' })
        await NoteActivity.create({
  user: req.user.id,
  action: 'edit',
  noteTitle: note.title
});

        res.json({ note })
    } catch (error) {
        console.error(error.message)
        res.status(500).send({ error: "internal server error" })
    }
})

router.delete('/deletenote/:id', fectchuser, async (req, res) => {
    // const {title,  description} = req.body;
    try {


        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("note found") };

        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("not allow")
        }

        note = await Note.findByIdAndDelete(req.params.id)
        await NoteActivity.create({
  user: req.user.id,
  action: 'delete',
  noteTitle: note.title
});

        res.json({ "delete": "Success Full", note: note })
    } catch (error) {
        console.error(error.message)
        res.status(500).send({ error: "internal server error" })
    }
})


module.exports = router;