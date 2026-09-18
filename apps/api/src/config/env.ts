import dotenv from "dotenv";
import path from "node:path";

const nodeEnv = process.env.NODE_ENV ?? "development";

// Environment-specific file first (e.g. .env.production), so it can hold
// that environment's real, distinct credentials; .env fills in anything
// not already set (mainly useful for plain local development).
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
dotenv.config();

export const env = {
  nodeEnv,
  port: process.env.PORT ? Number(process.env.PORT) : 5001,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
  },
  mysql: {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  },
  jwtSecret: process.env.JWT_SECRET,
  vectorDb: {
    provider: process.env.VECTOR_DB_PROVIDER,
    url: process.env.VECTOR_DB_URL,
  },
  evalLiveCallsEnabled: process.env.EVAL_LIVE_CALLS_ENABLED === "true",
};
