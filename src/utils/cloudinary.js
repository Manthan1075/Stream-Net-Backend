import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

async function uploadToCloudinary(filePath) {
    try {
        if (!filePath) {
            return null;
        }
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        const uploadResult = await cloudinary.uploader.upload(filePath, {
            resource_type: 'auto'
        });
        if (uploadResult.url) return uploadResult.url;
        fs.unlinkSync(filePath)
        return null
    } catch (error) {
        fs.unlinkSync(filePath)
        return null
    }
}

export { uploadToCloudinary }