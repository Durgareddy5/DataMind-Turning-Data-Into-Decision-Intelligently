import "dotenv/config";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { closePool } from "./db/pool.js";
import { runAnalysis } from "./agent/analysisAgent.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// No real auth yet (jsonwebtoken/bcrypt are installed but unwired), so the
// requesting user's id/roles are taken from the request body as a stand-in.
app.post("/api/analyze", async (req, res) => {
  const { question, sessionId, userId, roles } = req.body ?? {};

  if (typeof question !== "string" || question.trim().length === 0) {
    res.status(400).json({ error: "question is required" });
    return;
  }

  const user = {
    id: typeof userId === "string" && userId.length > 0 ? userId : "anonymous",
    roles: Array.isArray(roles) && roles.length > 0 ? roles : ["analyst"],
  };
  const session = typeof sessionId === "string" && sessionId.length > 0 ? sessionId : uuidv4();

  try {
    const result = await runAnalysis(question, user, session);
    res.json({ sessionId: session, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

async function shutdown(): Promise<void> {
  server.close();
  await closePool();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
