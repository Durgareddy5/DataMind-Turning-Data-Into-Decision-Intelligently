import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { searchHandler } from "./rag.controller.js";

export const ragRouter = Router();

ragRouter.get("/search", requireAuth, searchHandler);
