import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const PRODUCTION = process.env.PRODUCTION === "true";
export const PORT = process.env.PORT || 3000;
export const MONGODB_URL = process.env.MONGODB_URL;
export const JWT_SECRET = process.env.JWT_SECRET;
export const REFRESH_SECRET = process.env.REFRESH_SECRET;
export const UPLOAD_DIR = process.env.UPLOAD_DIR;

// AI Service Configuration
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
export const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY;

// PostgreSQL Configuration
export const PG_HOST = process.env.PG_HOST || "localhost";
export const PG_USER = process.env.PG_USER;
export const PG_PASSWORD = process.env.PG_PASSWORD;
export const PG_DATABASE = process.env.PG_DATABASE || "crowdsense_db";
export const PG_PORT = process.env.PG_PORT || 5432;

// System Admin Credentials
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Google OAuth Credentials
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// SendGrid Configuration
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;   
export const EMAIL_FROM = process.env.EMAIL_FROM;
export const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";

// Redis Configuration
export const REDIS_HOST = process.env.REDIS_HOST || "localhost";
export const REDIS_PORT = process.env.REDIS_PORT || 6379;