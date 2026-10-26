// const  mongoose = require('mongoose');
// const mongoUri = "mongodb+srv://shawaizkhan233:PxgWguZFuRCLNpw1@cluster0.axpbaoh.mongodb.net/inotebook";

// const connectToMongoose = async () => {
//     await mongoose.connect(mongoUri);
//     console.log("MongoDB connected successfully");

// };
// module.exports = connectToMongoose;


const mongoose = require('mongoose');
require('dotenv').config();

//const mongoUri = "mongodb+srv://shawaizkhan233_db_user:gFQuBmyrX4EzjBbo@cluster0.p9dl1un.mongodb.net/";

const connectToMongoose = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected successfully ");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
    }
};

module.exports = connectToMongoose;
