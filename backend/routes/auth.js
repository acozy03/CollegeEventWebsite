import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // Ensure JWT_SECRET is loaded

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Store user data in request
    next(); // Proceed to the next middleware
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
}
export default authenticate; 
