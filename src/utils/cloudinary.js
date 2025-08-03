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
async function getThumbnail(videoPublicId) {
    try {
        const response = await cloudinary.uploader.explicit(videoPublicId, {
            resource_type: "video",
            type: "upload",
            eager: [
                {
                    format: "jpg",
                    transformation: [
                        { start_offset: "2", width: 500, crop: "scale" },
                    ],
                },
            ],
        });

        return response.eager?.[0]?.secure_url || null;
    } catch (error) {
        console.error("Error getting thumbnail from Cloudinary:", error);
        return null;
    }
}


export { uploadToCloudinary, deleteFromCloudinary, getThumbnail }