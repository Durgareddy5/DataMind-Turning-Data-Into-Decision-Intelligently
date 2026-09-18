export const ADMIN_ROLE = "admin";

// "table.column" entries here always reject the query, for every role.
export const DENIED_COLUMNS: string[] = [];

// "table.column" -> the roles (besides admin, who always sees everything)
// allowed to see it unmasked. Any other role gets "***" in its place —
// e.g. only Sales sees live customer contact info; only HR sees employee
// email addresses. Least-privilege by default: a column with no entry here
// isn't sensitive and is never masked.
export const SENSITIVE_COLUMNS: Record<string, string[]> = {
  "customers.email": ["sales"],
  "customers.phone": ["sales"],
  "employees.email": ["hr"],
};
