export function createAuthMiddleware({ verifyJwt, loadUser }) {
  async function requireAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization || "";
      const [scheme, token] = authHeader.split(" ");

      if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ message: "Authentication token is required" });
      }

      const payload = verifyJwt(token);

      if (loadUser) {
        const user = await loadUser(payload.sub);
        if (!user) {
          return res.status(401).json({ message: "Invalid authentication token" });
        }
        req.user = user;
      } else {
        req.auth = payload;
        req.user = {
          _id: payload.sub,
          id: payload.sub,
          email: payload.email,
          role: payload.role
        };
      }

      next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired authentication token" });
    }
  }

  function requireAdmin(req, res, next) {
    const role = req.user?.role || req.auth?.role;
    if (!["admin", "rta_admin", "amc_admin"].includes(role)) {
      return res.status(403).json({ message: "Admin access is required" });
    }
    next();
  }

  function requireRole(...roles) {
    return (req, res, next) => {
      const role = req.user?.role || req.auth?.role;
      if (!roles.includes(role)) {
        return res.status(403).json({ message: "This admin role is not allowed to access this module" });
      }
      next();
    };
  }

  return { requireAuth, requireAdmin, requireRole };
}
