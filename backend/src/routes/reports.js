import express from 'express';
import { postReport, getAllReports, getReportById, getReportsByUserId, postReportFeedback, checkDuplicateFingerprint } from '../controllers/reports.js';

const router = express.Router();

router.route('/')
    .get(getAllReports)
    .post(postReport);

router.get('/user', getReportsByUserId);
router.post('/user/:reportId/feedback', postReportFeedback);
router.get('/check-duplicate', checkDuplicateFingerprint);

router.get('/:reportId', getReportById);

export default router;
