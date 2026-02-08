import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration (RUNS ON IMPORT)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // remove local file after successful upload
        fs.unlinkSync(localFilePath);

        // console.log("File uploaded successfully:", response.secure_url);

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
