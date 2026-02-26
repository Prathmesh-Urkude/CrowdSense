import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../configs/env.js";

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