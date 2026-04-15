import Bull from "bull";
import { REDIS_HOST, REDIS_PORT } from "./env.js";

export const emailQueue = new Bull("emailQueue", {
    redis: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
});