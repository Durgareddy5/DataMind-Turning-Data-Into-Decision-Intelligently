import mysql from "mysql2/promise";
import { env } from "../config/env.js";

export const pool = mysql.createPool({
  host: env.mysql.host,
  port: env.mysql.port,
  database: env.mysql.database,
  user: env.mysql.user,
  password: env.mysql.password,
  connectionLimit: 10,
  // Without this, DECIMAL columns (money) come back as strings and break
  // downstream numeric analysis (analyze_result, chart specs, aggregates).
  decimalNumbers: true,
});

export async function closePool(): Promise<void> {
  await pool.end();
}
