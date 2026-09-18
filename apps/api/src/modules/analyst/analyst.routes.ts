import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getAnalysisHandler, startAnalysisHandler } from "./analyst.controller.js";

export const analystRouter = Router();

analystRouter.post("/analysis", requireAuth, startAnalysisHandler);
analystRouter.get("/analysis/:id", requireAuth, getAnalysisHandler);
