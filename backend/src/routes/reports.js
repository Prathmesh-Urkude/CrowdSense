import express from 'express';
import { pool } from '../configs/postgresql.js';

const router = express.Router();

router.route('/')
    .get((req, res) => {
        const query = 'SELECT * FROM reports LIMIT 10';
        try {
            const { error, results } = pool.query(query);
            res.status(200).json(results.rows);
        } catch (error) {
            console.error('Error fetching reports:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    })
    .post((req, res) => {
        const { title, description, image_url, lat, lng, created_by } = req.body;

        const query = 'INSERT INTO reports (title, description, image_url, location, created_by) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6) RETURNING *';
        const values = [title, description, image_url, lng, lat, created_by];  // longitude (lng) comes before latitude (lat) in PostGIS

        try {
            const { error, results } = pool.query(query, values);
            res.status(201).json({message: "Report created", report: results.rows[0]});
        }
        catch (error) {
            console.error('Error creating report:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });


export default router;