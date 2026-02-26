import express from "express";
import axios from "axios";
import { AI_SERVICE_URL, AI_SERVICE_API_KEY } from "../configs/env.js";

const router = express.Router();

router.post("/test", async (req, res) => {
    try {
        const response = await axios.post(
            AI_SERVICE_URL,
            {headers: {
                    "x-internal-api-key": AI_SERVICE_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({message: "AI service is working", aiResponse: response.data});
    }
    catch (error) {
        console.error("AI Service Error:", error.response?.data || error.message);
        res.status(500).json({success: false, error: error.response?.data || "AI service failed"});
    }
});

export default router;