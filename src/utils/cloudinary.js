import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import path from 'path';

async function uploadToCloudinary(filePath) {
    try {
        if (!filePath) return null;

        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto',
        });

        const absolutePath = path.resolve(filePath);
        fs.unlink(absolutePath, (err) => {
            if (err) {
                console.error(" Error deleting file:", err);
            }
        });

        return uploadResult || null;
    } catch (error) {
        console.error(" Error uploading to Cloudinary:", error);

        try {
            const absolutePath = path.resolve(filePath);
            fs.unlink(absolutePath, (err) => {
                if (err) console.error(" Error deleting file after failure:", err);
            });
        } catch (e) {
            console.error(" Failed to delete temp file on catch block:", e);
        }

        return null;
    }
}
async function deleteFromCloudinary(filePath, type) {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        const deleteResponse = await cloudinary.uploader.destroy(filePath, {
            resource_type: type || 'image',
        })

        return deleteResponse.result === 'ok';
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return false;
    }
}


export { uploadToCloudinary, deleteFromCloudinary }