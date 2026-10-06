---
id: chg-GH-1-test-plan
status: Proposed
created: 2026-10-06T00:00:00Z
last_updated: 2026-10-06T00:00:00Z
owners: [engineering]
service: conduit-frontend-articles
labels: [change]
links:
  change_spec: ./chg-GH-1-spec.md
  implementation_plan: null
  testing_strategy: ../../../../ai/rules/testing-strategy.md
version_impact: minor
summary: 'Verify article reading-time calculation, conditional display, optional body compatibility, and regression gates for GH-1.'
---

# Test Plan - Display estimated reading time on articles

## 1. Scope and Objectives

Verify that reading time is calculated locally at 200 words per minute, rounded up with a minimum of one minute, and formatted as "X min read". Protect the distinction between an absent body and an empty body, the existing author/date markup, and both article-page meta occurrences. Verify optional-body type compatibility and that the feature introduces no network requests.

### 1.1 In Scope

- F-1: pure reading-time calculation, boundary values, and practical Markdown stripping.
- F-2: pure formatting pipe and reading-time placement next to the date.
- F-3: shared meta and preview show/hide behavior, including null, undefined, and empty string.
- F-4 / DM-1: optional Article body and resulting type adjustments without behavior changes.
- NFR-1 through NFR-3: calculation latency, purity/determinism, and zero added requests.
- New co-located unit/component coverage; existing full unit and shared E2E regression suites; build and formatting gates; targeted manual verification.

### 1.2 Out of Scope & Known Gaps

- No backend/API changes, persisted-data changes, preview body fetching, configurable reading speed, or localization/pluralization variants.
- Do not add or modify tests in `realworld/`, change its submodule pointer, or introduce undiscovered local E2E specs.
- Existing shared E2E tests are regression evidence, not new feature-specific assertions. New feature behavior is covered by unit/component tests and the manual checklist.
- Live E2E execution depends on browser/backend availability and external-service approval. A fallback does not establish that the E2E part of AC-NFR-1-1 passed.

## 2. References

- [Change specification](./chg-GH-1-spec.md): capabilities, ACs, DM-1, NFRs, and decisions DEC-1 through DEC-4.
- [PM notes](./chg-GH-1-pm-notes.yaml): preview behavior, placement, optional Article body, and identified touchpoints.
- [Canonical repository testing strategy](../../../../ai/rules/testing-strategy.md).
- Structural guidance: `.samourai/core/templates/test-plan-template.md`, `.samourai/blueprints/testing/test.blueprint.yaml`, and `.samourai/blueprints/testing/test-plan.template.md`.
- Implementation plan: not present at authoring; section 7 identifies proposed test locations, not approved implementation filenames.

**Strategy source:** The canonical `testing-strategy.md` is now present and was read for this plan. PM-provided repository context supplements it; the earlier missing-file exception is no longer needed. The canonical strategy clarifies that there is no supported local `e2e/` directory despite the spec's tooling reference.

## 3. Coverage Overview

“Planned” means a verification path is specified, not implemented or passed.

### 3.1 Functional Coverage (F-#, AC-#)

| Acceptance criterion | Capability    | Verification                                                                       | TC IDs                                                                                               | Status                                    |
| -------------------- | ------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| AC-F-1-1             | F-1           | Ceiling at 200 WPM and practical Markdown exclusions                               | TC-READTIME-001, TC-READTIME-003                                                                     | Planned                                   |
| AC-F-1-2             | F-1, F-2      | Empty, whitespace-only, and short bodies show "1 min read"                         | TC-READTIME-002, TC-READTIME-004, TC-READTIME-005                                                    | Planned                                   |
| AC-F-3-1             | F-3           | Previews show reading time only for a present body; no absent-body placeholder     | TC-READTIME-005, TC-READTIME-006                                                                     | Planned                                   |
| AC-F-2-1             | F-2, F-3      | Both article-page meta blocks display the same value next to the date              | TC-READTIME-007                                                                                      | Planned                                   |
| AC-F-1-3             | F-1, F-2, F-3 | Required empty/short/long/Markdown/pipe/show-hide tests exist and run              | TC-READTIME-001, TC-READTIME-002, TC-READTIME-003, TC-READTIME-004, TC-READTIME-005, TC-READTIME-011 | Planned                                   |
| AC-NFR-1-1           | F-4, NFR-3    | Full existing unit and E2E suites remain green; build checks optional-body fallout | TC-READTIME-010, TC-READTIME-011                                                                     | Planned; E2E conditional on prerequisites |

F-4 additionally maps to TC-READTIME-006 and TC-READTIME-011: a typed preview fixture omits body and compilation verifies dependent consumers, including the editor.

### 3.2 Interface Coverage (API-#, EVT-#, DM-#)

| Interface                                              | Scope                                                                                  | TC IDs                                            | Status                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| DM-1                                                   | Client Article body becomes optional; omitted-body fixture compiles and renders safely | TC-READTIME-006, TC-READTIME-011                  | Planned                                                            |
| Existing `GET /api/articles/:slug`                     | Unchanged body-present response consumed by article page                               | TC-READTIME-007, TC-READTIME-010, TC-READTIME-012 | Component/manual coverage planned; backend API E2E automation TODO |
| Existing `GET /api/articles`, `GET /api/articles/feed` | Unchanged body-absent list responses; no per-preview body fetch                        | TC-READTIME-006, TC-READTIME-010, TC-READTIME-012 | Component/manual coverage planned; backend API E2E automation TODO |

The spec assigns no API-_ or EVT-_ IDs and introduces no events or changed HTTP contract. TC-READTIME-012 explicitly records the API E2E location gap because existing HTTP interfaces are referenced; it does not add backend requirements or authorize new E2E tests.

### 3.3 Non-Functional Coverage (NFR-#)

| Requirement | Verification                                                                 | TC IDs                           | Status                 |
| ----------- | ---------------------------------------------------------------------------- | -------------------------------- | ---------------------- |
| NFR-1       | A 10,000-word body computes in less than 5 ms on a typical developer machine | TC-READTIME-009                  | Planned measured check |
| NFR-2       | Repeated/interleaved calls return identical values and cause no side effects | TC-READTIME-008                  | Planned                |
| NFR-3       | No new HTTP requests, particularly no preview detail fetches                 | TC-READTIME-010, TC-READTIME-011 | Planned                |

## 4. Test Types and Layers

| Layer                  | Tools and location                                                           | Approach                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Pure function and pipe | Vitest; co-located `src/app/shared/**/*.spec.ts`                             | Table-driven expected values and independently counted Markdown fixtures; no live backend                             |
| Angular component      | Vitest + jsdom + Angular TestBed; co-located `src/**/*.spec.ts`              | Real template/pipe composition, input changes and change detection, scoped DOM assertions; controlled service doubles |
| HTTP-boundary checks   | Vitest + TestBed + HttpTestingController in affected component/service specs | Flush known responses; verify expected requests and absence of unexpected detail fetches; not backend E2E             |
| Existing user-flow E2E | Playwright; read-only `realworld/specs/e2e/*.spec.ts`                        | Run `bun run test:e2e`; no new E2E specs or submodule changes                                                         |
| Manual / performance   | Running frontend and developer-machine timing harness                        | Both meta blocks, feed/profile behavior, network evidence, and measured 10,000-word latency                           |
| Quality gates          | Angular CLI and Prettier                                                     | `bunx ng build` (equivalent build gate: `bun run build`); `bun run format:check`                                      |

Use `bunx vitest run` rather than watch mode. Import Vitest APIs explicitly; globals are disabled. Follow existing `describe('Subject')` / `it('should ...')` conventions. Use the configured Angular Vite plugin, jsdom, Zone.js, and shared `src/test-setup.ts`; do not reinitialize TestBed globally. Reset mocks and fixtures between tests. HTTP mocks must be verified after each test.

Backend API E2E means real HTTP against a running backend, not HttpTestingController. The strategy has no approved writable backend API E2E location for this change; TC-READTIME-012 and section 8 record that gap. No Docker/Compose dependency is assumed.

## 5. Test Scenarios

### 5.1 Scenario Index

| TC ID           | Title                                         | Scenario type | Impact    | Priority | Test types        | Requirement coverage                   |
| --------------- | --------------------------------------------- | ------------- | --------- | -------- | ----------------- | -------------------------------------- |
| TC-READTIME-001 | Round whole-minute boundaries                 | Edge Case     | Important | High     | Unit              | F-1, AC-F-1-1, AC-F-1-3                |
| TC-READTIME-002 | Enforce the one-minute minimum                | Edge Case     | Important | High     | Unit              | F-1, F-2, AC-F-1-2, AC-F-1-3           |
| TC-READTIME-003 | Count Markdown content, not syntax            | Corner Case   | Important | High     | Unit              | F-1, AC-F-1-1, AC-F-1-3                |
| TC-READTIME-004 | Format reading time consistently              | Happy Path    | Important | High     | Unit              | F-2, AC-F-1-2, AC-F-1-3                |
| TC-READTIME-005 | Show or hide shared meta reading time         | Edge Case     | Important | High     | Unit              | F-2, F-3, AC-F-1-2, AC-F-3-1, AC-F-1-3 |
| TC-READTIME-006 | Render previews with optional bodies          | Regression    | Important | High     | Unit, Manual      | F-3, F-4, DM-1, AC-F-3-1               |
| TC-READTIME-007 | Show reading time in both article meta blocks | Happy Path    | Important | High     | Unit, Manual      | F-2, F-3, AC-F-2-1                     |
| TC-READTIME-008 | Keep calculation pure and deterministic       | Regression    | Important | Medium   | Unit              | F-1, NFR-2                             |
| TC-READTIME-009 | Measure long-body calculation latency         | Edge Case     | Important | Medium   | Performance       | F-1, NFR-1                             |
| TC-READTIME-010 | Add no network traffic                        | Regression    | Important | High     | Unit, Manual      | F-3, NFR-3, AC-NFR-1-1                 |
| TC-READTIME-011 | Run full regression and quality gates         | Regression    | Important | High     | Unit, E2E, Manual | F-4, DM-1, AC-F-1-3, AC-NFR-1-1        |
| TC-READTIME-012 | Resolve real-HTTP API E2E coverage location   | Regression    | Important | Medium   | E2E               | Existing HTTP interfaces; TODO         |

### 5.2 Scenario Details

#### TC-READTIME-001 - Round whole-minute boundaries

**Scenario Type**: Edge Case  
**Impact Level**: Important  
**Priority**: High  
**Related IDs**: F-1, AC-F-1-1, AC-F-1-3  
**Test Type(s)**: Unit  
**Automation Level**: Automated  
**Target Layer / Location**: Pure function, co-located spec under `src/app/shared/`  
**Tags**: @ui

**Preconditions**:

- Independently generated plain-text fixtures contain exactly 200, 201, 400, 401, and 10,000 whitespace-separated words.

**Steps**:

1. Call `readingTime(body)` for each fixture.
2. Repeat boundary cases using tabs, line breaks, and repeated spaces as separators.

**Expected Outcome**:

- Results are respectively 1, 2, 2, 3, and 50 minutes.
- Whitespace separator changes do not change the word count or introduce empty tokens.

#### TC-READTIME-002 - Enforce the one-minute minimum

**Scenario Type**: Edge Case  
**Impact Level**: Important  
**Priority**: High  
**Related IDs**: F-1, F-2, AC-F-1-2, AC-F-1-3  
**Test Type(s)**: Unit  
**Automation Level**: Automated  
**Target Layer / Location**: Pure function and pipe specs under `src/app/shared/`  
**Tags**: @ui

**Preconditions**:

- Fixtures include `""`, spaces, tabs/newlines, one word, and a short sentence.

**Steps**:

1. Calculate reading time for each fixture.
2. Format each through the planned pure reading-time pipe.

**Expected Outcome**:

- Calculation returns 1 and the displayed text is exactly "1 min read" for every fixture.
- No zero-minute, blank, or invalid-number output is produced.

#### TC-READTIME-003 - Count Markdown content, not syntax

**Scenario Type**: Corner Case  
**Impact Level**: Important  
**Priority**: High  
**Related IDs**: F-1, AC-F-1-1, AC-F-1-3  
**Test Type(s)**: Unit  
**Automation Level**: Automated  
**Target Layer / Location**: Pure function spec under `src/app/shared/`  
**Tags**: @ui

**Preconditions**:

- Section 6 defines separately countable fixtures for every syntax family and a combined fixture.
- Expected counts are derived from intended visible content, never from the production stripping function.

**Steps**:

1. Place each small syntax fixture after plain filler so its expected retained content reaches exactly 200 words.
2. Calculate reading time, then add one ordinary word and calculate again.
3. Repeat for the combined fixture and syntax-only fixtures.

**Expected Outcome**:

- At 200 retained words the result is 1; with one added word it is 2.
- Fence markers, inline backticks, link/image URLs, heading/emphasis/blockquote/list markers, HTML tags, and horizontal rules do not inflate the count.
- Link text remains counted. Ordinary words inside inline code, fenced content, headings, lists, blockquotes, and HTML remain content; the spec excludes syntax, not those words.
- Syntax-only content produces the minimum of 1 minute.

**Notes / Clarifications**:

- Use common syntax, not an exhaustive Markdown-parser contract. Image alt-text and fence language-label counting are not specified; do not invent an oracle for them (section 8).
- Boundary-padded assertions are essential: a short fixture alone returning 1 would not prove stripping.

#### TC-READTIME-004 - Format reading time consistently

**Scenario Type**: Happy Path  
**Impact Level**: Important  
**Priority**: High  
**Related IDs**: F-2, AC-F-1-2, AC-F-1-3  
**Test Type(s)**: Unit  
**Automation Level**: Automated  
**Target Layer / Location**: Pure pipe, `src/app/shared/pipes/`, co-located spec  
**Tags**: @ui

**Preconditions**:

- The planned pipe is pure and composes the calculation with formatting; use its actual implemented input signature.

**Steps**:

1. Exercise cases representing 1, 2, 3, and 50 minutes.
2. Exercise empty and whitespace-only bodies through the real function/pipe composition.
3. Repeat an input and inspect the pipe declaration during review.

**Expected Outcome**:

- Text is exactly "1 min read", "2 min read", "3 min read", or "50 min read" as applicable.
- No pluralization variant or localization is introduced; the pipe is pure and output is stable.

#### TC-READTIME-005 - Show or hide shared meta reading time

**Scenario Type**: Edge Case  
**Impact Level**: Important  
**Priority**: High  
**Related IDs**: F-2, F-3, AC-F-1-2, AC-F-3-1, AC-F-1-3  
**Test Type(s)**: Unit  
**Automation Level**: Automated  
**Target Layer / Location**: Co-located `article-meta.component.spec.ts` beside `ArticleMetaComponent`  
**Tags**: @ui

**Preconditions**:

- TestBed renders the real standalone component and pipe with a fixed author/date fixture and required routing dependencies.
- Body variants include omitted, explicit undefined, null, empty, whitespace-only, short, and 401 words. Null is a narrow boundary fixture, not a change to the declared optional-string contract.

**Steps**:

1. Render each body variant and trigger change detection.
2. Query `.reading-time` and existing `.article-meta` / `.date` elements.
3. Change the component input from absent to present and back, then from one body length to another.

**Expected Outcome**:

- Null/undefined/omitted body renders no `.reading-time` element and no placeholder text.
- Empty, whitespace-only, and short bodies render one element containing "1 min read"; 401 words render "3 min read".
- The new element is beside `.date` inside the existing info block. Existing date text, author links, and markup remain unchanged.
- Input changes update or remove the element; stale reading time never remains.

#### TC-READTIME-006 - Render previews with optional bodies

**Scenario Type**: Regression  
**Impact Level**: Important  
**Priority**: High  
**Related IDs**: F-3, F-4, DM-1, AC-F-3-1  
**Test Type(s)**: Unit, Manual  
**Automation Level**: Semi-automated  
**Target Layer / Location**: Co-located `article-preview.component.spec.ts`; running home/profile lists  
**Tags**: @ui

**Preconditions**:

- A typed Article fixture omits body without a cast; separate fixtures supply empty and 201-word bodies.
- Render the real preview/meta composition with isolated dependencies.

**Steps**:

1. Render each preview fixture and inspect its meta block.
2. Follow the home/profile manual checklist in section 6 against current list responses.

**Expected Outcome**:

- Omitted body compiles and renders with no reading-time element or placeholder.
- A supplied empty body shows "1 min read"; 201 words show "2 min read" automatically.
- Current home/profile previews show nothing for reading time. Existing title, description, author/date, and navigation remain intact.

#### TC-READTIME-007 - Show reading time in both article meta blocks

**Scenario Type**: Happy Path  
**Impact Level**: Important  
**Priority**: High  
**Related IDs**: F-2, F-3, AC-F-2-1  
**Test Type(s)**: Unit, Manual  
**Automation Level**: Semi-automated  
**Target Layer / Location**: Co-located page spec under `src/app/features/article/pages/article/`; running article page  
**Tags**: @ui

**Preconditions**:

- A controlled article load returns the complete article with a 401-word body, then an empty-body variant.
- The page's real template and both meta occurrences are rendered; unrelated service dependencies are controlled.

**Steps**:

1. Load the fixture through the page's normal load flow and settle asynchronous work/change detection.
2. Locate the banner meta block and the bottom-actions meta block separately.
3. Repeat with an empty body and perform the corresponding manual checklist.

**Expected Outcome**:

- Each location has exactly one reading-time element with "3 min read", or "1 min read" for the empty body.
- Both values agree and sit next to their existing date element, not in an unrelated meta block.
- Author/date and existing article actions remain unchanged.

#### TC-READTIME-008 - Keep calculation pure and deterministic

**Scenario Type**: Regression  
**Impact Level**: Important  
**Priority**: Medium  
**Related IDs**: F-1, NFR-2  
**Test Type(s)**: Unit  
**Automation Level**: Automated  
**Target Layer / Location**: Pure function spec under `src/app/shared/`  
**Tags**: @ui

**Preconditions**:

- Fixed boundary and Markdown inputs; isolated spies for observable external effects where applicable.

**Steps**:

1. Calculate the same input repeatedly, interleaved with different inputs.
2. Assert the input fixture remains unchanged and no network, storage, DOM, or timer effect occurs.
3. Review the implementation for mutable shared state or dependency on time/randomness.

**Expected Outcome**:

- Each input always produces the same expected value regardless of previous calls.
- The function performs local computation only, with no externally observable side effects.

#### TC-READTIME-009 - Measure long-body calculation latency

**Scenario Type**: Edge Case  
**Impact Level**: Important  
**Priority**: Medium  
**Related IDs**: F-1, NFR-1  
**Test Type(s)**: Performance  
**Automation Level**: Semi-automated  
**Target Layer / Location**: Focused function test/timing harness under `src/app/shared/` on a typical developer machine  
**Tags**: @ui @perf

**Preconditions**:

- A preconstructed 10,000-word body; dependencies already loaded; normal idle developer machine.

**Steps**:

1. Verify the result is 50 minutes before timing.
2. Warm up the function, then use a monotonic high-resolution clock to measure 100 individual calls.
3. Exclude fixture generation, framework startup, and rendering; record machine/runtime, timing distribution, and maximum observed duration.

**Expected Outcome**:

- Each measured calculation completes in less than 5 ms and returns 50.
- If an outlier occurs, investigate machine load and record both runs rather than hiding it in an average. A repeated breach on a representative machine is a failure; an unsuitable environment is inconclusive, not passed.

**Notes / Clarifications**:

- Keep functional long-body assertions in normal unit coverage. Do not make noisy shared-runner timing the sole performance evidence.

#### TC-READTIME-010 - Add no network traffic

**Scenario Type**: Regression  
**Impact Level**: Important  
**Priority**: High  
**Related IDs**: F-3, NFR-3, AC-NFR-1-1  
**Test Type(s)**: Unit, Manual  
**Automation Level**: Semi-automated  
**Target Layer / Location**: Article page/preview component specs with HttpTestingController or service request spies; browser Network panel  
**Tags**: @ui @api

**Preconditions**:

- Controlled existing article/list responses; a recorded pre-change request baseline for the same user flows where available.
- Live requests require external-service approval.

**Steps**:

1. Render body-present and body-absent previews and repeat change detection/input updates; assert no body-fetch service calls.
2. Load the article page and a multi-preview list; flush only the known pre-existing HTTP requests and verify no unmatched requests remain.
3. Inspect browser Network activity for home/profile lists and article navigation; compare with the established baseline, separating unrelated asset/auth/comment traffic.

**Expected Outcome**:

- Reading-time computation/rendering adds zero requests.
- Lists do not trigger per-preview `GET /api/articles/:slug` calls. The page uses its normal article load, not an extra request for either meta occurrence.
- No new API method, parameter, response contract, or persistence operation is introduced.

#### TC-READTIME-011 - Run full regression and quality gates

**Scenario Type**: Regression  
**Impact Level**: Important  
**Priority**: High  
**Related IDs**: F-4, DM-1, AC-F-1-3, AC-NFR-1-1  
**Test Type(s)**: Unit, E2E, Manual  
**Automation Level**: Semi-automated  
**Target Layer / Location**: `src/**/*.spec.ts`, read-only `realworld/specs/e2e/`, root build/format tooling  
**Tags**: @ui @e2e

**Preconditions**:

- Dependencies and submodule are available. For E2E, Chromium, reachable backend, and approval for external-service actions are available.

**Steps**:

1. Run `bunx vitest run`; confirm required function, pipe, and meta cases are discovered, not skipped.
2. Run `bunx ng build` and `bun run format:check`.
3. Run `bun run test:e2e` without modifying shared specs or the submodule pointer.
4. If E2E cannot run, execute the fallback in section 6 and record the blocked command, reason, outstanding evidence, and owner in section 10.

**Expected Outcome**:

- Full unit suite and build/format checks pass, including existing auth/article-service coverage and optional-body consumers such as the editor.
- Existing non-security E2E suite remains green; `.article-meta`, `.date`, and `window.__conduit_debug__` compatibility is retained.
- A blocked E2E run is marked Blocked/Not run. AC-NFR-1-1 remains partially unverified until rerun or explicit PM/human disposition; fallback results are not labeled E2E success.

#### TC-READTIME-012 - Resolve real-HTTP API E2E coverage location

**Scenario Type**: Regression  
**Impact Level**: Important  
**Priority**: Medium  
**Related IDs**: Existing HTTP interfaces in spec section 8.1; no API-\* IDs or changed backend acceptance path  
**Test Type(s)**: E2E  
**Automation Level**: Semi-automated  
**Target Layer / Location**: TODO — strategy provides read-only shared `realworld/specs/e2e/` only; no approved writable backend API E2E location  
**Tags**: @backend @api @e2e

**Preconditions**:

- TODO: PM/engineering confirms whether existing real-HTTP shared coverage is sufficient for unchanged endpoints or approves a location and execution path. No new E2E implementation is authorized by this plan.

**Steps**:

1. After that decision and external-service approval, use HTTP/the real API client against a running service to read a known article and its list response.
2. Verify successful status, response body shape, and relevant JSON content-type header; confirm detail body is available and the current list response omits body.
3. Correlate those responses with the client show/hide checks in TC-READTIME-006 and TC-READTIME-007.

**Expected Outcome**:

- Unchanged read endpoints return their documented representation; no persisted/downstream change is required by this frontend-only feature.
- TODO remains explicit until the coverage decision and runnable path are documented. Mocked HTTP or UI unit checks must not be reported as backend API E2E evidence.

## 6. Environments and Test Data

### Environments and isolation

- Unit/component: configured Vitest Angular environment with jsdom; no backend, real credentials, or persistent fixtures. Use TestBed fixtures, fresh Article objects, controlled observables/responses, and per-test teardown.
- Build/format: repository root with installed dependencies; build catches optional-body type fallout outside directly tested components.
- Performance: typical developer machine with recorded runtime/hardware; prebuild inputs and isolate calculation from startup/rendering.
- Manual/E2E: Angular dev server at `http://localhost:4200`. Shared Playwright configuration starts it through `npm run start`, uses Chromium and one worker, and selects `realworld/specs/e2e`.
- Backend-dependent flows currently target `https://api.realworld.show/api`. Obtain approval before external-service tests; any destructive fixture setup needs an approved dedicated environment. Prefer existing synthetic/read-only data for this feature. Never store real secrets.
- `API_MODE=false` is not an offline backend substitute; `API_BASE` changes shared helpers, not the app's hard-coded API interceptor.

### Data / fixture catalog

Generate plain bodies independently, for example `Array.from({ length: n }, () => "word").join(" ")`; assert the intended fixture count without calling production stripping logic.

| Fixture family    | Samples / construction                                                                                                        | Oracle                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Minimum           | Empty string, `"   "`, `"\t\n "`, `"hello"`, `"a short sentence"`                                                             | 1 minute; body is present                                              |
| Boundaries        | Exactly 200 / 201 / 400 / 401 words                                                                                           | 1 / 2 / 2 / 3 minutes                                                  |
| Long              | Exactly 10,000 words                                                                                                          | 50 minutes; less than 5 ms for calculation                             |
| Separators        | Equivalent tokens split by tabs, newlines, or repeated spaces                                                                 | Same count as single-space version                                     |
| Fenced code       | Triple-backtick lines with `alpha beta` between them; no language label in the exact-count fixture                            | Fence markers excluded; content words retained                         |
| Inline code       | `` `alpha beta` ``                                                                                                            | Backticks excluded; two content words retained                         |
| Links/images      | `[alpha beta](https://example.test/a/b)` and `![](https://example.test/image.png)`                                            | Two link-text words retained; URLs and empty-alt image syntax excluded |
| Heading           | `## alpha beta`                                                                                                               | Two words; heading marker excluded                                     |
| Emphasis          | `**alpha** _beta_ ~~gamma~~`                                                                                                  | Three words; emphasis markers excluded                                 |
| Lists             | `- alpha`, `* beta`, `+ gamma`, `1. delta`, `2. epsilon`, each on its own line                                                | Five content words; bullet/number markers excluded                     |
| Blockquote        | `> alpha beta`                                                                                                                | Two words; quote marker excluded                                       |
| HTML              | `<p>alpha beta</p>`                                                                                                           | Two words; tags excluded                                               |
| Horizontal rules  | Isolated `---`, `***`, and `___` lines                                                                                        | No content words; minimum result 1 if alone                            |
| Combined Markdown | Join the above common syntax families with known plain content                                                                | Independently counted content padded to 200, then 201 words            |
| Syntax only       | Empty fences, empty links/images, empty HTML tags, standalone rules/heading/blockquote markers                                | No content words; minimum result 1                                     |
| Article metadata  | Fixed author, slug, title, description, timestamps, tags, and action flags; bodies omitted/undefined/null/empty/201/401 words | Only reading-time visibility/value varies; author/date stable          |

Use empty image alt text and unlabeled fences in exact-count fixtures to avoid inventing unspecified counting rules. A plain URL is not a Markdown link URL; do not silently define all bare URLs as excluded. No persistent seed/migration is required. Clean up any approved live test account/article according to the shared suite's existing procedures, not by changing the submodule.

### Manual verification checklist

- [ ] Open a known article and inspect both banner and bottom-actions meta blocks separately: exactly one "X min read" each, matching independently computed expected minutes (TC-READTIME-007).
- [ ] Confirm reading time is beside the date inside the info block; `.date`, author links, and actions remain unchanged (TC-READTIME-005, TC-READTIME-007).
- [ ] Using a controlled local fixture or approved test article, verify an empty body displays "1 min read" in both blocks (TC-READTIME-002, TC-READTIME-007).
- [ ] Browse home/global feed and profile article/favorite lists with current body-omitting API responses: no reading-time element or placeholder (TC-READTIME-006).
- [ ] Confirm a controlled body-present preview shows the correct value; do not fetch extra bodies to make this happen (TC-READTIME-006).
- [ ] Check Network activity on list and article navigation: zero feature-added requests, no per-preview detail fetch, and no duplicate fetch for the second meta block (TC-READTIME-010).
- [ ] If optional-body handling changes the editor, verify an approved non-destructive editor load still populates existing body content normally (TC-READTIME-011).

### E2E unavailable: explicit fallback

Run `bunx vitest run`, `bunx ng build`, and `bun run format:check`; retain targeted preview/page, optional-body, and network-boundary unit coverage, and complete every feasible manual item above. If the backend/browser also blocks manual flows, record those separately. Record `bun run test:e2e` as Blocked/Not run with the actual prerequisite/error, AC-NFR-1-1's outstanding E2E evidence, and engineering as rerun owner. PM/human review must resolve or explicitly accept that remaining gap; lower-layer checks do not replace it.

## 7. Automation Plan and Implementation Mapping

All new executable specs must be co-located under `src/**/*.spec.ts`. The filenames below are proposed where implementation names are not yet fixed; keep actual names aligned with their source files. Do not create a new test runner/configuration or modify `realworld/`.

| TC ID           | Test file / evidence location                                                                                | Command / method                                                               | Mocking and data                                                              | Implementation status                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| TC-READTIME-001 | `src/app/shared/utils/reading-time.spec.ts` beside the eventual function                                     | `bunx vitest run` or focused spec run                                          | Boundary/long plain fixtures; no mocks                                        | To Implement                                                       |
| TC-READTIME-002 | Function spec and `src/app/shared/pipes/reading-time.pipe.spec.ts`                                           | `bunx vitest run`                                                              | Minimum-body table                                                            | To Implement                                                       |
| TC-READTIME-003 | Function spec                                                                                                | `bunx vitest run`                                                              | Independent boundary-padded Markdown fixtures                                 | To Implement                                                       |
| TC-READTIME-004 | `src/app/shared/pipes/reading-time.pipe.spec.ts`                                                             | `bunx vitest run`                                                              | Real pure function/pipe; no backend                                           | To Implement                                                       |
| TC-READTIME-005 | `article-meta.component.spec.ts` beside existing meta component                                              | `bunx vitest run`                                                              | TestBed, real template/pipe, fixed author/date and body variants              | To Implement                                                       |
| TC-READTIME-006 | `article-preview.component.spec.ts` beside existing preview component; manual evidence here                  | `bunx vitest run`; manual checklist                                            | Typed body-omitting Article, real meta, isolated collaborators                | To Implement; manual follow-up                                     |
| TC-READTIME-007 | `src/app/features/article/pages/article/article.component.spec.ts`; manual evidence here                     | `bunx vitest run`; manual checklist                                            | Controlled article load, real page/meta templates, unrelated services doubled | To Implement; manual follow-up                                     |
| TC-READTIME-008 | Function spec and implementation review evidence                                                             | `bunx vitest run`                                                              | Repeated/interleaved inputs; isolated side-effect spies                       | To Implement                                                       |
| TC-READTIME-009 | Focused timing case alongside the function spec; developer-machine measurements here                         | Focused `bunx vitest run` timing harness plus recorded measurements            | Prebuilt 10,000-word fixture; no network                                      | To Implement; measured follow-up                                   |
| TC-READTIME-010 | Preview/page specs; browser Network evidence here                                                            | `bunx vitest run`; manual network comparison                                   | HttpTestingController/service spies, controlled list/detail responses         | To Implement; manual follow-up                                     |
| TC-READTIME-011 | Existing `src/**/*.spec.ts`, new change specs, read-only `realworld/specs/e2e/*.spec.ts`; gate evidence here | `bunx vitest run`; `bunx ng build`; `bun run format:check`; `bun run test:e2e` | Existing suite fixtures and approved backend; fallback if unavailable         | Existing – No Change for shared E2E; run all gates after new specs |
| TC-READTIME-012 | TODO: approved real-HTTP API E2E location/run path; decision recorded here                                   | TODO: no approved new automation command                                       | Running service, known read-only article, approval; no HTTP mocks             | TODO – blocked pending coverage/location decision                  |

Implement lower-layer tests before production changes when practical. Run focused specs during development, then the full gates. AC-F-1-3 requires actual discovered tests for all listed categories, not just this design matrix. The separate security E2E suite is not required for this security-impact-none change unless scope changes.

## 8. Risks, Assumptions, and Open Questions

### 8.1 Risks

- RSK-1: Practical Markdown stripping is heuristic. Test each common syntax family with boundary-padded inputs; do not claim a complete Markdown parser.
- RSK-2: Existing E2E selectors may depend on `.article-meta` / `.date`. Assert old markup is unchanged and add only the reading-time sibling; run the existing E2E suite.
- RSK-3: Optional body may affect the editor or other consumers. Use a cast-free omitted-body fixture, run full unit coverage and build, and manually verify any adjusted consumer.
- RSK-4: Current previews legitimately hide reading time. Manual assertions must use actual response shape, not assume bodies exist or add fetches.
- Timing noise can obscure NFR-1. Record representative machine details and individual timing results; distinguish failures from unsuitable environments.
- Missing browser/backend/approval blocks E2E evidence. Preserve the outstanding AC-NFR-1-1 gap and its owner rather than treating fallback as success.

### 8.2 Assumptions

- Spec DEC-1 through DEC-4 and PM notes define behavior: null/undefined hide; empty string shows; date-adjacent placement; optional body; pure function and pipe.
- Words are whitespace-separated tokens after practical syntax stripping; 200 WPM is fixed.
- Existing detail/list endpoints remain unchanged. No new backend acceptance path or data mutation is introduced.
- Implementation plan and exact utility filenames are not yet available; section 7 locations are proposed co-location mappings, not requirements for production layout.

### 8.3 Open Questions

| Question                                                                                                                                                                 | Impact / disposition                                                                                                                                                                                                                               | Owner                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| For unchanged referenced HTTP interfaces, is existing shared real-HTTP E2E coverage sufficient, or where should any backend API E2E checks live and how should they run? | TC-READTIME-012 TODO. No writable API E2E convention exists; local additions are not discovered and the shared submodule must remain unchanged. Do not add tests without an approved convention decision. Not a new frontend behavior requirement. | PM / engineering                             |
| Should nonempty image alt text or fence language labels count as words?                                                                                                  | Non-blocking clarification of “where practical”; exact-count fixtures avoid both ambiguities. Record a decision before asserting a specific count for those forms.                                                                                 | PM / engineering                             |
| If E2E is unavailable at execution, when will it be rerun or who explicitly accepts the remaining evidence gap?                                                          | Conditional gate question, not a current observed failure. AC-NFR-1-1 remains partially unverified until disposition; record actual reason and follow-up in section 10.                                                                            | Engineering rerun owner; PM / human approver |

## 9. Plan Revision Log

| Version | Date (UTC) | Author           | Changes                                                                                                                                                                                            |
| ------- | ---------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1     | 2026-10-06 | Test plan writer | Initial plan from GH-1 spec, PM notes, canonical strategy, and templates; all six ACs mapped; NFRs, Markdown fixtures, manual checks, existing E2E fallback, and API E2E location TODO documented. |

## 10. Test Execution Log

No tests or quality gates were executed while authoring this plan. All scenario outcomes are Not run; no pass result is implied by coverage mapping. For execution, add per-TC results, commands, timestamps, environment, evidence, and any blocked prerequisite/error. Keep failed/blocked attempts visible when recording reruns.

| TC ID / gate                    | Run date (UTC) | Result  | Evidence / notes                                               | Follow-up owner  |
| ------------------------------- | -------------- | ------- | -------------------------------------------------------------- | ---------------- |
| All planned scenarios and gates | Not run        | Not run | Planning only; no implementation or runtime evidence collected | Engineering      |
| TC-READTIME-012                 | Not run        | TODO    | No approved writable backend API E2E path; see section 8       | PM / engineering |
