// Roles with no entry here are denied by default; "*" grants every discovered table.
export const TABLE_ACCESS_POLICY: Record<string, string[] | "*"> = {
  admin: "*",
  analyst: ["orders", "order_items", "customers", "products", "regions", "employees"],
};
