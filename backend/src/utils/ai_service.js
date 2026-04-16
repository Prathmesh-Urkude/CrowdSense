import axios from "axios";
import { AI_SERVICE_URL, AI_SERVICE_API_KEY } from "../configs/env.js";

export const analyzeImage = async (image_url) => {
    try {
        const response = await axios.post(
            AI_SERVICE_URL + "/analyze",
            { image_url },
            {headers: {
                    "x-internal-api-key": AI_SERVICE_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    }
    catch (error) {
        console.error("AI Service Error:", error.response?.data || error.message);
        throw new Error("AI service failed", { cause: error });
    }
};

export const healthCheck = async (req, res) => {
    try {
        const response = await axios.post(
            AI_SERVICE_URL + "/healthCheck",
            { message: "Hello from the backend!" },
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
};