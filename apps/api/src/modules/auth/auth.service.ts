import bcrypt from "bcrypt";
import { findUserByUsername } from "./users.store.js";
import { signToken } from "./jwt.js";
import { UnauthorizedError } from "../../shared/errors/AppError.js";
import { createLogger } from "../../config/logger.js";
import type { LoginRequest, LoginResponse } from "./auth.schemas.js";

const logger = createLogger("auth");

export async function login({ username, password }: LoginRequest): Promise<LoginResponse> {
  const storedUser = findUserByUsername(username);
  // Never log the submitted password, even on failure.
  const passwordMatches = storedUser ? await bcrypt.compare(password, storedUser.passwordHash) : false;

  if (!storedUser || !passwordMatches) {
    logger.warn("login_failed", { username });
    throw new UnauthorizedError("Invalid username or password");
  }

  const token = signToken({ id: storedUser.id, roles: storedUser.roles });
  logger.info("login_succeeded", { userId: storedUser.id, roles: storedUser.roles });
  return { token, user: { id: storedUser.id, roles: storedUser.roles } };
}
