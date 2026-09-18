import type { AuthUser } from "@ai-data-analyst/shared-types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}
