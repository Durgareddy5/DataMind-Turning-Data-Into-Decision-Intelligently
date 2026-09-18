// "table.column" entries here always reject the query, for every role.
export const DENIED_COLUMNS: string[] = [];

// "table.column" entries here are allowed but masked in the result unless
// the user's role is in UNMASKED_ROLES.
export const SENSITIVE_COLUMNS: string[] = ["customers.email", "customers.phone", "employees.email"];

export const UNMASKED_ROLES: string[] = ["admin"];
