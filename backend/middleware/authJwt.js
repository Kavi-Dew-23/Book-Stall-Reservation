// backend/middleware/authJwt.js
import { verifyToken } from "../utils/jwt.js";


export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - Missing token" });
    }
    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token); 
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// role checker factory
export const verifyRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== role) {
    return res.status(403).json({ message: "Access denied - insufficient role" });
  }
  next();
};
