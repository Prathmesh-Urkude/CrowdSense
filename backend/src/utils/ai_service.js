import axios from "axios";
import { AI_SERVICE_URL, AI_SERVICE_API_KEY } from "../configs/env.js";

const analyzeImage = async (image_url) => {
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

export { analyzeImage };