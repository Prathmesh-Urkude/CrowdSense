import pool from '../configs/postgresql.js';

const toggleUpvote = async (req, res) => {
    const report_id = req.params.reportId;
    const user_id = req.user._id;

    try {
        // check if the user has already upvoted
        const checkQuery = 'SELECT * FROM upvotes WHERE report_id = $1 AND user_id = $2';
        const checkResult = await pool.query(checkQuery, [report_id, user_id]);

        if(checkResult.rows.length > 0) {
            // if upvote exists, remove it (toggle off)
            const deleteQuery = 'DELETE FROM upvotes WHERE report_id = $1 AND user_id = $2';
            await pool.query(deleteQuery, [report_id, user_id]);
            res.json({ message: 'Upvote removed' });
        }

        // if no upvote exists, add it (toggle on)
        const insertQuery = 'INSERT INTO upvotes (report_id, user_id) VALUES ($1, $2)';
        await pool.query(insertQuery, [report_id, user_id]);
        res.json({ message: 'Upvote added' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUpvoteCount = async (req, res) => {
    const { reportId } = req.params;

    try {
        const result = await pool.query(`SELECT COUNT(*) FROM upvotes WHERE report_id = $1`,[reportId]);
        res.status(200).json({reportId, upvotes: parseInt(result.rows[0].count)});
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkUserUpvote = async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user._id;

    try {
        const result = await pool.query(`SELECT 1 FROM upvotes WHERE report_id = $1 AND user_id = $2`,[reportId, userId]);
        res.status(200).json({hasUpvoted: result.rows.length > 0});
    } 
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export { toggleUpvote, getUpvoteCount, checkUserUpvote };