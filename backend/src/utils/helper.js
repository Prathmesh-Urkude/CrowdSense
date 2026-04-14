import crypto from "crypto";
import { PRODUCTION } from "../configs/env.js";

const generateState = () => crypto.randomBytes(32).toString("hex");

const cookieOptions = {
    httpOnly: true,
    secure: PRODUCTION,
    sameSite: "Strict"
};

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export { cookieOptions, hashToken, generateState };