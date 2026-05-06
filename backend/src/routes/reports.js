import express from 'express';
import { postReport, getAllReports, getReportById, getReportsByUserId, postReportFeedback, handleSimilarReports, deleteOwnReport } from '../controllers/reports.js';

const router = express.Router();

router.route('/')
    .get(getAllReports)
    .post(postReport);

router.get('/user/all', getReportsByUserId);
router.get('/:reportId', getReportById);
router.post('/user/:reportId/feedback', postReportFeedback);
router.post('/check-report', handleSimilarReports);
router.delete('/:reportId', deleteOwnReport);

export default router;