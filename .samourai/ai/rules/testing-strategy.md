# Repository Testing Strategy for Samourai Workflow

This document outlines the recommended testing strategy for the repository to
align with the Samourai change workflow and quality gates.

Principles:

- Fast unit tests that run on every commit and PR
- Explicit integration and end-to-end test suites run in CI quality gates
- Tests map to acceptance criteria in change artifacts under
  `.samourai/docai/changes/**`
- Test plans live alongside specs (chg-\*-test-plan.md) and are required for
  delivery gating.

Recommendations:

- Unit tests: vitest for fast feedback during development
- E2E: Playwright-based scenarios for critical user journeys
- Linting & formatting: Prettier + ESLint as quality gates
- Test-data: keep fixtures under `test/fixtures` and avoid committing secrets

Gating:

- Local: run `bun run test` and `bun run format:check` before committing
- CI: run full test matrix, e2e, and coverage; failures block merge

Traceability:

- Every change (one ticket) must include a `chg-<workItemRef>-test-plan.md`
  that maps acceptance criteria to tests.

Governance:

- Test strategy is a living document and should be updated when test tools or
  processes change.
