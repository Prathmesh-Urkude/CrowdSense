import User from "../models/user.js";
import pool from "../configs/postgresql.js";
import { deleteImageFromStorage } from "../middlewares/uploads.js";
import { sendStatusUpdateEmail } from "../utils/mailService.js";

export const createAdmin = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found.' });
        }
        existingUser.role = 'admin';
        await existingUser.save();
        return res.status(200).json({ message: 'User promoted to admin successfully.' });
    }
    catch (error) {
        console.error('Error promoting user to admin:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (req.user.id === id) {
            return res.status(400).json({ error: "You cannot delete yourself" });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ error: "Cannot delete another admin" });
        }

        user.isDeleted = true;
        user.deletedAt = new Date();
        user.refreshTokens = []; // logout everywhere

        await user.save();

        res.json({ message: "User soft deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remark } = req.body;

        const current = await pool.query(
            `SELECT * FROM reports WHERE id = $1`,
            [id]
        );
        if (current.rowCount === 0) {
            return res.status(404).json({ error: "Report not found" });
        }

        const currentReport = current.rows[0];
        if (currentReport.status === 'resolved') {
            return res.status(400).json({ error: "Cannot change status of resolved report" });
        }
        if (currentReport.status === status) {
            return res.status(400).json({ error: `Report is already in '${status}' status.` });
        }

        const result = await pool.query(
            `UPDATE reports
            SET status = $1,
            updated_by = $2,
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *`,
            [status, req.user.id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found.' });
        }

        const updatedReport = result.rows[0];
        const userData = await User.findById(updatedReport.createdBy);
        if (userData && !userData.isDeleted) {
            const emailData = {
                to: userData.email,
                username: userData.username || "User",
                reportId: updatedReport.id,
                description: updatedReport.description,
                previousStatus: currentReport.status,
                newStatus: status,
                remark,
                location: updatedReport.location || "Not specified",
                updatedBy: req.user.username || "Authority",
                updatedAt: new Date().toLocaleString("en-IN"),
            };
            sendStatusUpdateEmail(emailData)
            .catch((err) => console.error("Email failed:", err.message));
        }

        res.status(200).json({ message: 'Report status updated successfully.', report: result.rows[0] });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const reportRes = await pool.query(
            `SELECT * FROM reports WHERE id = $1`,
            [id]
        );

        if (reportRes.rowCount === 0) {
            return res.status(404).json({ error: "Report not found" });
        }
        if (reportRes.rows[0]?.status === 'resolved') {
            return res.status(400).json({ error: "Cannot delete resolved report" });
        }
        const report = reportRes.rows[0];

        const result = await pool.query(
            `DELETE FROM reports WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Report not found" });
        }
        deleteImageFromStorage(report.image_url);

        res.json({ message: "Report deleted successfully", report: result.rows[0] });

    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};