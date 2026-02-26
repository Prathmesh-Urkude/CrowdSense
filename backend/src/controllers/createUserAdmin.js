import User from "../models/user.js";
import { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME } from "../configs/env.js";

const seedAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({ email : ADMIN_EMAIL });
        if(existingAdmin) {
            console.log("Admin user already exists.");
            return;
        }
        await User.create({
            username: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin'
        });
        console.log("Admin user created successfully.");
    } catch (error) {
        console.error("Error creating admin user:", error);
    }
}

export default seedAdmin;