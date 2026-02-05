import User from "../models/user.js";
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
    const adminEmail = process.env.ADMIN_EMAIL;

    try {
        const existingAdmin = await User.findOne({ email : adminEmail });
        if(existingAdmin) {
            console.log("Admin user already exists.");
            return;
        }
        await User.create({
            username: process.env.ADMIN_USERNAME,
            email: adminEmail,
            password: process.env.ADMIN_PASSWORD,
            role: 'admin'
        });
        console.log("Admin user created successfully.");
    } catch (error) {
        console.error("Error creating admin user:", error);
    }
}

export default seedAdmin;