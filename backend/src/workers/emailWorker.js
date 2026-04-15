import { emailQueue } from '../configs/emailQueue.js';
import { sendSignUpEmail, sendStatusUpdateEmail } from '../utils/mailService.js';

console.log("📧 Email worker started...");;

emailQueue.process(async (job) => {
    const { type, data } = job.data;
    console.log("📩 Processing job:", job.data);
    try {
        switch (type) {
            case "SIGNUP":
                await sendSignUpEmail(data);
                break;

            case "STATUS_UPDATE":
                await sendStatusUpdateEmail(data);
                break;

            default:
                throw new Error("Unknown email type");
        }
        console.log("Email sent:", type);
    }
    catch (error) {
        console.error("Email failed:", error.message);
        throw err;
    }
});