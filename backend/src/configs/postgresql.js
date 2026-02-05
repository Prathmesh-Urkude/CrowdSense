import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,  
    database: process.env.PG_DATABASE,
    port: process.env.PG_PORT,
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

export default pool;