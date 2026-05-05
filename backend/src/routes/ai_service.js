import express from "express";
import { upload } from "../middlewares/uploads.js";
import { analyzeImage, healthCheck } from "../utils/ai_service.js";

const router = express.Router();

router.post("/healthCheck", healthCheck);

router.post("/analyze", upload.single('image'), async (req, res) => {
    const image_url = req.file ? `/uploads/images/${req.file.filename}` : null;
    if (!image_url) return res.status(400).json({ error: "No image uploaded" });
    try {
        const aiResult = await analyzeImage(image_url);
        res.json({ result: aiResult, image_url });
    } catch (err) {
        // AI service failed but image is saved — return image_url so frontend can still submit
        console.error("AI service error:", err.message);
        res.status(207).json({ error: "AI service unavailable", image_url });
    }
});



export default router;