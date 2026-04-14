import pool from '../configs/postgresql.js';
import { analyzeImage } from '../utils/ai_service.js';

const postReport = async (req, res) => {
    const { description, lat, lng } = req.body;
    const image_url = req.file ? `/uploads/images/${req.file.filename}` : null;
    const created_by = req.user?._id;

    if (!lat || !lng || !image_url) return res.status(400).json({ error: "Missing required fields" });

    const aiResult = await analyzeImage(image_url);
    const category = aiResult.damage_type || "uncategorized";
    const severity_score = aiResult.severity_score || 0;

    const priority_score = severity_score * 0.9 || 0;

    const query = `
        INSERT INTO reports (description, image_url, location, created_by, category, severity_score, priority_score) 
        VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8) RETURNING *`;
    const values = [description, image_url, lng, lat, created_by, category, severity_score, priority_score];  // longitude (lng) comes before latitude (lat) in PostGIS

    try {
        const results = await pool.query(query, values);
        res.status(201).json({ message: "Report created", report: results.rows[0] });
    }
    catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export { postReport };