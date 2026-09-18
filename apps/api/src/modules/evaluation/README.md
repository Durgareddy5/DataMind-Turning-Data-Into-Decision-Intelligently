No HTTP endpoint was specified for evaluation, so this stays a CLI concern:
the harness lives at `src/scripts/run-evaluation.ts`, reading cases/expected
results from the repo-root `evaluation/` directory (see its own README).
This module folder is reserved for if/when the eval harness gets an HTTP
surface (e.g. triggering a run and polling results, mirroring modules/analyst).
