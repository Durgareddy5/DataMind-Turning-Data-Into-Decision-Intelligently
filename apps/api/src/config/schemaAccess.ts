// Roles with no entry here are denied by default; "*" grants every discovered table.
export const TABLE_ACCESS_POLICY: Record<string, string[] | "*"> = {
  admin: "*",
  analyst: ["customers", "employees", "order_items", "orders", "products", "regions"],
  sales: ["customers", "orders", "order_items", "products", "regions"],
  finance: ["orders", "order_items", "products", "regions", "customers"],
  hr: ["employees", "regions"],
};
