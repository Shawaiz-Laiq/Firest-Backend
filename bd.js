const  mongoose = require('mongoose');
const mongoUri = "mongodb+srv://db_shawaizkhan233:PxgWguZFuRCLNpw1@cluster0.bncnzri.mongodb.net/inotebook?retryWrites=true&w=majority";

const connectToMongoose = async () => {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");

};
module.exports = connectToMongoose;