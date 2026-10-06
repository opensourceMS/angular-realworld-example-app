# Repository Testing Strategy

Canonical guidance for change test plans. Derive test cases from acceptance
criteria and risks; map every acceptance criterion to automated or explicit
manual verification.

## Test Layers and Module Mapping

| Scope                    | Test type and tools                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Pure functions and pipes | Vitest unit tests; exercise normal, boundary, and invalid inputs                                             |
| Angular components       | Vitest + jsdom component tests using Angular TestBed and fixtures; verify rendered behavior and interactions |
| HTTP services            | Vitest + TestBed + HttpTestingController; verify URLs, methods, parameters, bodies, responses, and errors    |
| Non-HTTP services        | Vitest unit tests; use TestBed where dependency injection is needed and mock collaborators                   |
| User flows               | Shared RealWorld Playwright E2E suite                                                                        |
| Compilation and bundling | Angular CLI `ng build`                                                                                       |
| Formatting               | Prettier check                                                                                               |

Vitest uses the Angular Vite plugin, jsdom, and `src/test-setup.ts`.
The setup initializes Angular testing with Zone.js and per-test teardown.
Existing specs cover services; component and pipe tests should use the same
configured runner.

## Test Conventions

- Co-locate tests with implementation as `<name>.spec.ts`; Vitest discovers
  only `src/**/*.spec.ts`.
- Import `describe`, `it`, `expect`, hooks, and mocks from `vitest`;
  globals are disabled.
- Name suites after the subject and cases after observable behavior, following
  existing `describe('ServiceName')` and `it('should ...')` conventions.
- HTTP specs currently use `HttpClientTestingModule` and
  `HttpTestingController`. Flush controlled responses and call
  `httpMock.verify()` after each test; do not use a live backend.
- New specs should rely on the shared TestBed environment initialization rather
  than repeating `initTestEnvironment`.
- Isolate mocks and state. Cover failure paths as well as successful behavior.
- Test data must not contain real secrets or user credentials.

## E2E Boundaries and Prerequisites

- Treat `realworld/` as a read-only submodule for individual changes.
  Do not modify shared E2E specs or update the submodule pointer per change.
- Root `playwright.config.ts` explicitly selects
  `realworld/specs/e2e`; it overrides the shared config's `./e2e` default.
- No repository-local `e2e/` directory currently exists. Local E2E additions
  would not be discovered by this configuration. Do not assume they are
  supported; obtain approval for an explicit convention/configuration change.
- Playwright runs Chromium with one worker and starts the Angular dev server
  through `npm run start` at `http://localhost:4200`.
- E2E requires the Playwright Chromium browser and a reachable backend for
  backend-dependent flows. The app currently targets
  `https://api.realworld.show/api`.
- Shared helpers default to API mode. `API_MODE=false` is not an offline
  backend replacement; form-based flows still depend on the app's backend.
  `API_BASE` affects helpers, not the app's hard-coded API interceptor.
- Preserve the app's `window.__conduit_debug__` interface. Helpers are actually
  at `realworld/specs/e2e/helpers/debug.ts`; the local path in CLAUDE.md is stale.
- External-service tests require approval. Destructive tests require an
  approved dedicated environment.

## Non-interactive Commands

Run from the repository root after dependencies and submodules are available.

```bash
bunx vitest run            # All unit/component/service specs; exits after running
bun run build             # ng build
bun run format:check      # Prettier; excludes realworld/**
bun run test:e2e           # Playwright; excludes @security
bun run test:e2e:security  # Playwright; only @security
```

Use `bunx vitest run <spec-path>` for focused development checks.
`bun run test` invokes plain Vitest; use explicit `run` for non-interactive gates.
Do not use UI, headed, or debug scripts as automated gates.

## Change Quality Gates and E2E Fallback

- The change test plan must map every acceptance criterion to test cases,
  test type, priority, data, commands, and risks; use
  `.samourai/blueprints/testing/test-plan.template.md` for structure.
- Run the complete Vitest suite, build, and format check before completion.
- Run the shared non-security E2E suite for affected user flows when
  prerequisites and external-service approval are available. Include the
  separate security suite for security-sensitive changes; the default E2E
  command does not cover it.
- If E2E is unavailable, run all available unit/component/service tests,
  build, and format checks. Add targeted lower-layer coverage and a manual
  flow checklist.
- Record the blocked command, missing prerequisite/error, unverified acceptance
  criteria, and follow-up owner in the change test plan. Mark E2E as blocked or
  not run, never passed. Lower-layer checks do not replace E2E evidence;
  PM/human review must explicitly resolve or accept the remaining gap.
