import app from './app.js';
import connectDB from './db/DB.js'
import dotenv from 'dotenv'
dotenv.config();
const PORT = process.env.PORT || 8070;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        })
        app.on('error', (error) => {
            console.error('Error occurred In App Start:', error);
        })
    })