import express from "express";
import { upload } from "../middlewares/uploads.js";
import { analyzeImage, healthCheck } from "../utils/ai_service.js";

const router = express.Router();

router.post("/healthCheck", healthCheck);

router.post("/analyze", upload.single('image'), async (req, res) => {
    const image_url = req.file ? `/uploads/images/${req.file.filename}` : null;
    const aiResult = await analyzeImage(image_url);
    res.json({ result: aiResult, image_url });
});



export default router;