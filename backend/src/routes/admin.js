import express from 'express';
import { createAdmin, deleteUser, updateReportStatus, deleteReport, getAllUsers } from '../controllers/admin.js';
import { serverAdapter } from '../configs/bullBoard.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ 
    message: "Welcome, Admin!",
    user: req.user   
  });
});

router.get('/users', getAllUsers);

router.post('/create-admin', createAdmin)
router.delete('/delete-user/:id', deleteUser);
router.patch('/report/:id/status', updateReportStatus);
router.delete('/report/:id', deleteReport);

router.use('/queues', serverAdapter.getRouter());

export default router;