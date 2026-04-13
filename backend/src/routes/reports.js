import express from 'express';
import pool from '../configs/postgresql.js';
import { postReport } from '../controllers/reports.js';

const router = express.Router();

router.route('/')
    .get(async (req, res) => {
        const query = 'SELECT * FROM reports ORDER BY priority_score DESC, created_at DESC LIMIT 20';
        try {
            const results = await pool.query(query);
            res.status(200).json(results.rows);
        } catch (error) {
            console.error('Error fetching reports:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    })
    .post(postReport);


export default router;