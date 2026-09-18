import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getAuditTrailHandler } from "./audit.controller.js";

export const auditRouter = Router();

auditRouter.get("/:analysisId", requireAuth, getAuditTrailHandler);
