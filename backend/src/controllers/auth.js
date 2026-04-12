import User from "../models/user.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { cookieOptions, hashToken } from "../utils/helper.js";

const login = async function (req, res) {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (!await user.comparePassword(password)) {
            return res.status(400).json({ error: 'Wrong password.' });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        const hashedToken = hashToken(refreshToken);
        user.refreshTokens.push({ token: hashedToken });
        await user.save();

        res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
        res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.status(200).json({ message: 'Signin successful.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Invalid credentials' });
    }
}

const signup = async function (req, res) {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email.' });
        }
        await User.create({ username, email, password });

        return res.status(201).json({ message: 'User created successfully.' });
    }
    catch (error) {
        console.error("SIGNUP ERROR:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const refresh = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);
    const hashedToken = hashToken(token);
    try {
        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded._id);
        if (!user) return res.sendStatus(403);

        const exists = user.refreshTokens.some(t => t.token === hashedToken);
        if (!exists) {
            user.refreshTokens = [];
            await user.save();
            return res.sendStatus(403);
        }

        user.refreshTokens = user.refreshTokens.filter(t => t.token !== hashedToken);

        const newRefreshToken = signRefreshToken(user);
        const newHashedToken = hashToken(newRefreshToken);
        user.refreshTokens.push({ token: newHashedToken });
        await user.save();

        const newAccessToken = signAccessToken(user);
        res.cookie("accessToken", newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });

        res.json({ message: "Token refreshed" });
    }
    catch (error) {
        return res.sendStatus(403);
    }
};

const logout = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);
    const hashedToken = hashToken(token);
    try {
        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded._id);
        if (user) {
            user.refreshTokens = user.refreshTokens.filter(t => t.token !== hashedToken);
            await user.save();
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res.json({ message: "Logged out" });
    }
    catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.sendStatus(403);
    }
};

const googleCallback = async (req, res) => {
    try {
        const user = req.user;
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        const hashedToken = hashToken(refreshToken);

        user.refreshTokens.push({ token: hashedToken });
        await user.save();

        res.cookie("accessToken", accessToken, {...cookieOptions, maxAge: 15 * 60 * 1000});
        res.cookie("refreshToken", refreshToken, {...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000});

        res.redirect("http://localhost:5173/dashboard");
    }
    catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.redirect("http://localhost:5173/login");
    }
};

export { login, signup, refresh, logout, googleCallback };