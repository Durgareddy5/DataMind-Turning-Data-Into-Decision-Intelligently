The real seed data lives at `infra/mysql/init/01-schema-and-seed.sql` (a
`mysqldump` of the actual `sales_business` schema + demo data), not here —
that's what Docker Compose's MySQL container runs on first boot. This
directory is reserved for app-level seed scripts if/when they're needed.
