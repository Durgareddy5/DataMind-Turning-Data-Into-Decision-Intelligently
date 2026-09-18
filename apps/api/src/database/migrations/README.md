No migration framework is wired up yet (no knex/umzug/etc.). The current
schema is provisioned entirely by `infra/mysql/init/01-schema-and-seed.sql`,
run once by MySQL's Docker entrypoint on first container start. Add a real
migration tool here before making further schema changes beyond local dev.
