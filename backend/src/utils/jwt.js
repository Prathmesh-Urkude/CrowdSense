import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET

function signToken(user) { 
    const payload = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    return token;
}

function verifyToken(token) {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
}

export { signToken, verifyToken };