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
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,

        location GEOGRAPHY(Point, 4326), -- PostGIS
        status VARCHAR(20) DEFAULT 'pending',

        created_by VARCHAR NOT NULL, -- MongoDB userId (string)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

async function initTables() {
    await addPostGISExtension();
    await genUUID();
    await createReportTable();
    await createUpvoteTable();
}

export { initTables };