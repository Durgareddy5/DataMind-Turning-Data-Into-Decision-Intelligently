import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  connectionLimit: 10,
  // Without this, DECIMAL columns (money) come back as strings and break
  // downstream numeric analysis (analyze_result, chart specs, aggregates).
  decimalNumbers: true,
});

export async function closePool(): Promise<void> {
  await pool.end();
}
