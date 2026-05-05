import pool from '../configs/postgresql.js';
import User from '../models/user.js';
import userFeedback from '../models/userFeedback.js';

export const postReport = async (req, res) => {
    const { aiResult, description, lat, lng, categoryByUser, image_url } = req.body;
    const created_by = req.user?._id;

    if (!lat || !lng || !image_url) return res.status(400).json({ error: "Missing required fields" });

    const category = categoryByUser || aiResult.damage_type || "uncategorized";
    const severity_score = aiResult.severity_score || 0;
    const priority_score = severity_score * 0.7 || 0;

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

export const getAllReports = async (req, res) => {
    const query = `SELECT id, description, category, severity_score, 
        upvote_count, priority_score, status, image_url, created_by, created_at, 
        ST_Y(location:: geometry) AS lat, ST_X(location:: geometry) AS lng, 
        updated_by, updated_at
        FROM reports 
        WHERE status = 'reported' OR status = 'under-review'
        ORDER BY priority_score DESC, created_at DESC LIMIT 20`;
    try {
        const results = await pool.query(query);
        res.status(200).json(results.rows);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getReportById = async (req, res) => {
    const { reportId } = req.params;
    const query = `SELECT id, description, category, severity_score, 
        upvote_count, priority_score, status, image_url, created_by, created_at, 
        ST_Y(location:: geometry) AS lat, ST_X(location:: geometry) AS lng, 
        updated_by, updated_at
        FROM reports
        WHERE id = $1`;

    try {
        const result = await pool.query(query, [reportId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        const user = await User.findById(result.rows[0].created_by);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (req.user._id == result.rows[0].created_by || req.user.role == 'admin') {
            return res.status(200).json({ report: result.rows[0], user });
        }
        res.status(403).json({ report: result.rows[0] });
    }
    catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getReportsByUserId = async (req, res) => {
    const userId = req.user._id;
    const query = `SELECT id, category, upvote_count, status, image_url, created_at, 
        ST_Y(location:: geometry) AS lat, ST_X(location:: geometry) AS lng
        FROM reports
        WHERE created_by = $1`;
    try {
        const results = await pool.query(query, [userId]);
        res.status(200).json(results.rows);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const postReportFeedback = async (req, res) => {
    const { reportId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    try {
        const report = await pg.query(
            "SELECT id, created_by FROM reports WHERE id = $1",
            [reportId]
        );
        if (report.rowCount == 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        if (report.rows[0].created_by != userId) {
            return res.status(400).json({ error: "Access denied" });
        }
        await userFeedback.create({ reportId, userId, rating, comment });
        res.status(201).json({ message: "Feedback submitted" });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};