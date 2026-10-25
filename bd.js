const  mongoose = require('mongoose');
const mongoUri = "mongodb+srv://db_shawaizkhan233:PxgWguZFuRCLNpw1@cluster0.axpbaoh.mongodb.net/inotebook";

const connectToMongoose = async () => {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");

};
module.exports = connectToMongoose;