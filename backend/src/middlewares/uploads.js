import multer from "multer";
import path from "path";
import { UPLOAD_DIR } from '../configs/env.js';

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.resolve(UPLOAD_DIR + "/images"));

    },
    filename: (req, file, cb) => {
        const uniquename = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniquename);
    }
});

// File filter for allowed types (images)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /\.(jpeg|jpg|png|webp)$/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    const allowedMime = /^image\/(jpeg|jpg|png|webp)$/;
    const mimetype = allowedMime.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed"));
    }
};

// Multer upload instance
export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const deleteImageFromStorage = (imageUrl) => {
    try {
        if (!imageUrl) return;

        const filename = path.basename(imageUrl);
        const filePath = path.resolve(`${UPLOAD_DIR}/images/${filename}`);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log("Image deleted:", filePath);
        } else {
            console.log("Image not found:", filePath);
        }
    } 
    catch (err) {
        console.error("Error deleting image:", err.message);
    }
};