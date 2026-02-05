import User from "../models/user.js";

const createAdmin = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found.' });
        }
        existingUser.role = 'admin';
        await existingUser.save();
        return res.status(200).json({ message: 'User promoted to admin successfully.' });
    }
    catch (error) {
        console.error('Error promoting user to admin:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
}

export { createAdmin };