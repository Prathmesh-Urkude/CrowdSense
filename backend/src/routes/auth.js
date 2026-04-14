import express from 'express';
import { login, signup, refresh, logout, googleCallback } from '../controllers/auth.js';
import passport from "../configs/passport.js";
import { generateState, cookieOptions } from "../utils/helper.js";
import { authenticateJWT } from '../middlewares/auth.js';

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/logout", logout);
router.post("/refresh", refresh);

router.get("/google", (req, res, next) => {
    const state = generateState();
    res.cookie("oauth_state", state, { ...cookieOptions, maxAge: 5 * 60 * 1000 });

    passport.authenticate("google", {
        scope: ["profile", "email"],
        state
    })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
    const stateFromGoogle = req.query.state;
    const stateFromCookie = req.cookies.oauth_state;

    if (!stateFromGoogle || stateFromGoogle !== stateFromCookie) {
        return res.status(403).json({ error: "Invalid state" });
    }
    res.clearCookie("oauth_state");
    next();
},
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/login"
    }),
    googleCallback
);

router.get("/me", authenticateJWT, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

export default router;