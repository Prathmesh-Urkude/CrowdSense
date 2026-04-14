import { verifyAccessToken } from "../utils/jwt.js";

function authenticateJWT(req, res, next) {
  if(req.path === '/') {
    return next();
  }
  const token = req.cookies.accessToken;
	if (!token) return res.sendStatus(401);
  try {
    const user = verifyAccessToken(token);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: "Permission denied" });
      }
      next();
    };
}

export { authenticateJWT, authorizeRoles };