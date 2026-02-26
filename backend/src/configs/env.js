import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// AI Service Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY;

// PostgreSQL Configuration
const PG_HOST = process.env.PG_HOST || "localhost";
const PG_USER = process.env.PG_USER;
const PG_PASSWORD = process.env.PG_PASSWORD;
const PG_DATABASE = process.env.PG_DATABASE || "crowdsense_db";
const PG_PORT = process.env.PG_PORT || 5432;

// System Admin Credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export {
    PORT,
    MONGODB_URL,
    JWT_SECRET,
    AI_SERVICE_URL,
    AI_SERVICE_API_KEY,
    PG_HOST,
    PG_USER,
    PG_PASSWORD,
    PG_DATABASE,
    PG_PORT,
    ADMIN_USERNAME,
    ADMIN_EMAIL,
    ADMIN_PASSWORD
};