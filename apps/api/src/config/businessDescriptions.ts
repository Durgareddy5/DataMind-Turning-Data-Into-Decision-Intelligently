export const BUSINESS_DESCRIPTIONS: {
  tables: Record<string, string>;
  columns: Record<string, string>;
} = {
  tables: {},
  columns: {
    // Found via real UI testing: without this, generated SQL sometimes
    // treated discount_percent as a fraction (1 - 5 = -4), producing large
    // negative "revenue" figures. This is stored as plain metadata, not a
    // real RAG lookup — the business-glossary vector pipeline is still a
    // deferred, separate build (see modules/rag).
    "order_items.discount_percent": "Stored as a whole-number percentage (e.g. 5 means 5%, not 0.05). Line revenue = quantity * unit_price * (1 - discount_percent / 100.0).",
  },
};
