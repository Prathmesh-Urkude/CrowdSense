import pool from '../configs/postgresql.js';

const toggleUpvote = async (req, res) => {
    const report_id = req.params.reportId;
    const user_id = req.user._id;

    try {
        let increment = 0;
        await pool.query("BEGIN");
        const insertResult = await pool.query(
            `INSERT INTO upvotes (report_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING
             RETURNING *`,
            [report_id, user_id]
        );
        if (insertResult.rows.length > 0) increment = 1;
        else{
            await pool.query(
                `DELETE FROM upvotes
                 WHERE report_id = $1 AND user_id = $2`,
                [report_id, user_id]
            );
            increment = -1;
        }

        await pool.query(
            `UPDATE reports
            SET 
                upvote_count = upvote_count + $2,
                priority_score = 0.7 * (severity_score / 12) 
                               + 0.3 * (
                                    LOG(upvote_count + $2 + 1) / 
                                    (LOG(upvote_count + $2 + 1) + 1)
                                )
            WHERE id = $1 AND upvote_count + $2 >= 0
            `,
            [report_id, increment]
        );

        await pool.query('COMMIT');

        res.json({message: increment === 1 ? 'Upvote added' : 'Upvote removed'});
    }
    catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    }
};

const getUpvoteCount = async (req, res) => {
    const { reportId } = req.params;

    try {
        const result = await pool.query(`SELECT upvote_count FROM reports WHERE report_id = $1`,[reportId]);
        res.status(200).json({reportId, upvotes: parseInt(result.rows[0].upvote_count)});
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