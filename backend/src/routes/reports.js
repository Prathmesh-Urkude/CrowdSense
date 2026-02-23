import express from 'express';
import pool from '../configs/postgresql.js';
import upload from '../middlewares/uploads.js';
import { postReport } from '../controllers/reports.js';

const router = express.Router();

router.route('/')
    .get(async (req, res) => {
        const query = 'SELECT * FROM reports LIMIT 10';
        try {
            const results = await pool.query(query);
            res.status(200).json(results.rows);
        } catch (error) {
            console.error('Error fetching reports:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    })
    .post(upload.single('image'), postReport);


export default router;