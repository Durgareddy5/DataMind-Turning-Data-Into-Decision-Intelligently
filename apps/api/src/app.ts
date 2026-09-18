import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { requestId } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { analystRouter } from "./modules/analyst/analyst.routes.js";
import { conversationsRouter } from "./modules/conversations/conversations.routes.js";
import { schemaRouter } from "./modules/schema/schema.routes.js";
import { ragRouter } from "./modules/rag/rag.routes.js";
import { auditRouter } from "./modules/audit/audit.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(requestId);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1", analystRouter);
  app.use("/api/v1/conversations", conversationsRouter);
  app.use("/api/v1/schema", schemaRouter);
  app.use("/api/v1/rag", ragRouter);
  app.use("/api/v1/audit", auditRouter);

  app.use(errorHandler);

  return app;
}
