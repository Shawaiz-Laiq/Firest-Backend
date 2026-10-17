const  mongoose = require('mongoose');
const mongoUri = "mongodb://localhost:27017/inotebook";

const connectToMongoose = async () => {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");

};
module.exports = connectToMongoose;