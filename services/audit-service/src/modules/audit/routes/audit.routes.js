import { Router } from "express";
import { getAuditLogsByResource, writeAuditLog } from "../services/audit.service.js";

export function createAuditRouter({ requireAuth, requireRole }) {
  const router = Router();
  router.use(requireAuth, requireRole("admin", "rta_admin"));

  router.get("/:resourceType/:resourceId", async (req, res, next) => {
    try {
      const entries = await getAuditLogsByResource(req.params.resourceType, req.params.resourceId);
      res.json({ entries });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createInternalAuditRouter({ requireInternalService }) {
  const router = Router();

  router.post("/", requireInternalService, async (req, res, next) => {
    try {
      const entry = await writeAuditLog(req.body);
      res.status(201).json({ entry });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
