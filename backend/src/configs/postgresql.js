import pkg from 'pg';
import { PG_HOST, PG_USER, PG_PASSWORD, PG_DATABASE, PG_PORT } from './env.js';

const { Pool } = pkg;

const pool = new Pool({
    host: PG_HOST,
    user: PG_USER,
    password: PG_PASSWORD,  
    database: PG_DATABASE,
    port: PG_PORT,
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

export default pool;