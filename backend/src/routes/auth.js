import express from 'express';
import { login, signup, refresh, logout } from '../controllers/auth.js';

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/logout", logout);
router.post("/refresh", refresh);

export default router;