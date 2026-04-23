import express from 'express';
import { postReport, getAllReports, getReportById, getReportsByUserId, postReportFeedback } from '../controllers/reports.js';

const router = express.Router();

router.route('/')
    .get(getAllReports)
    .post(postReport);

router.get('/:reportId', getReportById);

router.get('/user', getReportsByUserId);
router.post('/user/:reportId/feedback', postReportFeedback);

export default router;