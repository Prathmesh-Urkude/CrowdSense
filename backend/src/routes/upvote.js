import express from 'express';
import { toggleUpvote, getUpvoteCount, checkUserUpvote } from '../controllers/upvote.js';

const router = express.Router();

router.post('/:reportId', toggleUpvote);
router.get('/:reportId/count', getUpvoteCount);
router.get('/:reportId/status', checkUserUpvote);

export default router;