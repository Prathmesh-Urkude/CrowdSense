import jwt from "jsonwebtoken";
import { JWT_SECRET, REFRESH_SECRET } from "../configs/env.js";

function signAccessToken(user) { 
	const payload = {
		_id: user._id,
		username: user.username,
		email: user.email,
		role: user.role
	};
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

function signRefreshToken(user) {
	const payload = {
		_id: user._id,
		username: user.username,
		email: user.email,
		role: user.role
	};
	return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

function verifyAccessToken(token) {
	return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
	return jwt.verify(token, REFRESH_SECRET);
}

export { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };