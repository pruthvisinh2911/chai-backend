import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration (RUNS ON IMPORT)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {string} localFilePath
 * @param {string} folder
 */
const uploadOnCloudinary = async (localFilePath, folder = "uploads") => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: folder, // ✅ IMPORTANT
        });

        // remove local file after successful upload
        fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error);

        // remove temp file if upload fails
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

export { uploadOnCloudinary };
