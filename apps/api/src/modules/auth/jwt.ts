import jwt from "jsonwebtoken";
import type { AuthUser } from "@ai-data-analyst/shared-types";

const JWT_EXPIRES_IN = "8h";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required to sign or verify tokens");
  }
  return secret;
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ roles: user.roles }, getSecret(), {
    subject: user.id,
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, getSecret());
  if (typeof payload === "string" || typeof payload.sub !== "string" || !Array.isArray(payload.roles)) {
    throw new Error("Malformed token payload");
  }
  return { id: payload.sub, roles: payload.roles };
}
