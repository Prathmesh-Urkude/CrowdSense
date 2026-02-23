import pool from '../configs/postgresql.js';

const postReport = async (req, res) => {
        const { title, description, lat, lng, created_by } = req.body;
        const image_url = req.file ? `/uploads/images/${req.file.filename}` : null;

        if (!title || !lat || !lng || !image_url) return res.status(400).json({error: "Missing required fields"});

        const query = 'INSERT INTO reports (title, description, image_url, location, created_by) VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), $6) RETURNING *';
        const values = [title, description, image_url, lng, lat, created_by];  // longitude (lng) comes before latitude (lat) in PostGIS

        try {
            const results = await pool.query(query, values);
            res.status(201).json({message: "Report created", report: results.rows[0]});
        }
        catch (error) {
            console.error('Error creating report:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

export { postReport };