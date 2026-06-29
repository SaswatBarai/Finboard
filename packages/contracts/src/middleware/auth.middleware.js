import jwt from "jsonwebtoken";
import { getUserById } from "../clients/auth-client.js";

function verifyJwt(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.verify(token, process.env.JWT_SECRET);
}

function wrapUser(user) {
  if (!user) return null;
  const id = user._id || user.id;
  return {
    _id: id,
    id: id?.toString?.() || id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    toSafeJSON() {
      return {
        id: id?.toString?.() || id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    }
  };
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Authentication token is required" });
    }
    const payload = verifyJwt(token);
    const user = wrapUser(await getUserById(payload.sub));
    if (!user) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired authentication token" });
  }
}

export function requireAdmin(req, res, next) {
  if (!["admin", "rta_admin", "amc_admin"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Admin access is required" });
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "This admin role is not allowed to access this module" });
    }
    next();
  };
}
