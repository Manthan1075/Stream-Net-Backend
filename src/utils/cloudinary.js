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

        if (uploadResult.secure_url) {

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return uploadResult.secure_url;
        } else {

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return null;
        }
    } catch (error) {
        console.log("Error uploading to Cloudinary:", error);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return null;
    }
}

async function deleteFromCloudinary(filePath) {
    
}


export { uploadToCloudinary }