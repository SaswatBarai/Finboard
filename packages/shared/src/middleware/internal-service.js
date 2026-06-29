export function requireInternalService(expectedKey) {
  return (req, res, next) => {
    const key = req.headers["x-service-key"];
    if (!key || key !== expectedKey) {
      return res.status(403).json({ message: "Internal service access denied" });
    }
    next();
  };
}
