import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getSchemaHandler } from "./schema.controller.js";

export const schemaRouter = Router();

schemaRouter.get("/", requireAuth, getSchemaHandler);
