import express from 'express';
import { login, signup } from '../controllers/auth.js';

const router = express.Router();

router.route('/login')
    .post(login);

router.route('/signup')
    .post(signup);

router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});
export default router;