import express from 'express';
import { createAdmin, createUser, deleteUser, getReports, updateReportStatus, deleteReport } from '../controllers/admin.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ 
    message: "Welcome, Admin!",
    user: req.user   
  });
});

router.post('/create-admin', createAdmin)
router.delete('/delete-user/:id', deleteUser);
router.patch('/report/:id/status', updateReportStatus);
router.delete('/report/:id', deleteReport);

export default router;