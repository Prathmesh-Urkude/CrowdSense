import express from "express";
import { upload, deleteImageFromStorage } from "../middlewares/uploads.js";
import { analyzeImage, healthCheck } from "../utils/ai_service.js";

const router = express.Router();

router.post("/healthCheck", healthCheck);

router.post("/analyze", upload.single('image'), async (req, res) => {
    const image_url = req.file ? `/uploads/images/${req.file.filename}` : null;
    if (!image_url) return res.status(400).json({ error: "No image uploaded" });
    try {
        const aiResult = await analyzeImage(image_url);
        res.json({ result: aiResult, image_url });
    } 
    catch (error) {
        console.error('Error analyzing image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post("/retry", async (req, res) => {
    try {
        await deleteImageFromStorage(req.body.image_url);
        res.status(200).json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;