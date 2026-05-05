import pool from "../configs/postgresql.js";

async function addPostGISExtension() {
    const query = `CREATE EXTENSION IF NOT EXISTS postgis;`;
    try {
        const result = await pool.query(query);
        console.log("PostGIS extension ensured:");
    } catch (err) {
        console.error("Error ensuring PostGIS extension:", err);
    }
}

async function genUUID() {
    const query = `CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
    try {
        const result = await pool.query(query);
        console.log("pgcrypto extension ensured for UUID generation:");
    } catch (err) {
        console.error("Error ensuring pgcrypto extension:", err);
    }
}

async function createReportTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        description TEXT,
        image_url TEXT,
        category VARCHAR,
        severity_score FLOAT,
        upvote_count INTEGER DEFAULT 0,
        priority_score FLOAT,

        location GEOGRAPHY(Point, 4326), -- PostGIS
        status VARCHAR(20) DEFAULT 'pending',

        created_by VARCHAR NOT NULL, -- MongoDB userId (string)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        updated_by VARCHAR,
        updated_at TIMESTAMP
        );
    `;
    try {
        const result = await pool.query(query);
        console.log("Reports table created or already exists:");
    } catch (err) {
        console.error("Error creating reports table:", err);
    }
}

async function createUpvoteTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS upvotes (
        report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL, -- MongoDB userId
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (report_id, user_id) -- prevents double voting
        );
    `;
    try {
        const result = await pool.query(query);
        console.log("Upvotes table created or already exists:");
    } catch (err) {
        console.error("Error creating upvotes table:", err);
    }
}

async function migrateReportsTable() {
    const migrations = [
        `ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_by VARCHAR`,
        `ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`,
        `ALTER TABLE reports ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'reported'`,
        // Fix default for tables that were created with DEFAULT 'pending'
        `ALTER TABLE reports ALTER COLUMN status SET DEFAULT 'reported'`,
        // Backfill old rows that got 'pending' before the default was corrected
        `UPDATE reports SET status = 'reported' WHERE status = 'pending' OR status IS NULL`,
        // Recalculate priority_score with correct formula (old formula used severity_score/12 which shrunk scores to ~3)
        `UPDATE reports SET priority_score = 0.7 * severity_score + 0.3 * (LOG(GREATEST(upvote_count,0) + 1) / (LOG(GREATEST(upvote_count,0) + 1) + 1)) * 100 WHERE severity_score IS NOT NULL`,
        // File fingerprint for cross-session duplicate image detection
        `ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_fingerprint VARCHAR`,
    ];
    for (const sql of migrations) {
        try {
            await pool.query(sql);
        } catch (err) {
            console.error('Migration error:', err.message);
        }
    }
    console.log("Reports table migrations applied:");
}

async function initPGTables() {
    await addPostGISExtension();
    await genUUID();
    await createReportTable();
    await createUpvoteTable();
    await migrateReportsTable();
}

export { initPGTables };