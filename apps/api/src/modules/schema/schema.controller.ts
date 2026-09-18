import type { NextFunction, Request, Response } from "express";
import { getAuthorizedSchema } from "./schema.service.js";

export async function getSchemaHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = await getAuthorizedSchema(req.user!);
    res.json(schema);
  } catch (err) {
    next(err);
  }
}
