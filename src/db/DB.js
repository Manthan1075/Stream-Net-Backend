import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


async function connectDB() {
    try {
        const connectionRes = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("Connected to MongoDB:", connectionRes.connection.host);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

export default connectDB;