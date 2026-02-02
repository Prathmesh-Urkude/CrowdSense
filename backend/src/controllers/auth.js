import User from "../models/user.js";
import { signToken } from "../utils/jwt.js";

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

        const token = signToken(user);
        return res.status(200).json({ message: 'Signin successful.', token });
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
        res.status(500).json({ error: 'Internal server error' });
    }
};

export { login, signup };