import express from 'express';
import { createAdmin } from '../controllers/admin.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ 
    message: "Welcome, Admin!",
    user: req.user   
  });
});

router.post('/create-admin', createAdmin)

export default router;