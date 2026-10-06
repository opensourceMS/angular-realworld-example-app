---
id: chg-GH-1-article-reading-time
status: Proposed
created: 2026-10-06T00:00:00Z
last_updated: 2026-10-06T00:00:00Z
owners: [engineering]
service: conduit-frontend-articles
labels: [change]
links:
  change_spec: ./chg-GH-1-spec.md
summary: >
  Readers currently get no indication of how long an article takes to read.
  This change shows an estimated reading time ("X min read") computed client-side
  from the article body, with no API change. The time is rendered inside the shared
  article meta block next to the date, and only when the article body is available
  (PM decision DEC-1).
version_impact: minor
---

# IMPLEMENTATION PLAN — GH-1: Display estimated reading time on articles

## Context and Goals

Deliver F-1 through F-4 and G-1 through G-3 from the canonical spec: a pure calculation at 200 WPM, a pure formatting pipe, conditional date-adjacent display in shared metadata, and an accurate optional-body model. Preserve existing author/date markup, article actions, API requests, and editor behavior.

**Current behavior discovery:** Angular 21 standalone components use OnPush. `ArticleMetaComponent` is used by previews and twice by the article page. Detail responses contain body; current list responses omit it. `Article.body` is currently required. The article page passes it to `MarkdownPipe.transform(content: string)`, so optional-body compilation requires a narrow fallback at that call site. The editor patches the complete article into an untyped form; do not rewrite it merely because the model changes. `ArticlesService` already accepts `Partial<Article>` for writes.

**Architecture:** Export `readingTime(body: string): number` and `ReadingTimePipe` from `src/app/shared/pipes/reading-time.pipe.ts`; co-locate their tests in `reading-time.pipe.spec.ts`. Keep visibility in the component, not the function: null/undefined hide the element, but an empty string is a present body and produces one minute. Use practical local Markdown stripping, not a new parser or HTTP dependency. Keep fenced and inline code content and link text; strip syntax and Markdown destination URLs.

**Planning mode:** The optional project profile is absent. Use small, independently verifiable feature increments with current-behavior discovery, minimal changes, and preservation tests. No scaffolding, new package, runner configuration, telemetry, migration, or architectural decision is needed for the specified design.

**Resolved decisions:** DEC-1 through DEC-4 govern visibility, placement, optional body, and function/pipe separation. PM notes resolve TC-READTIME-012 as **N/A** because HTTP contracts are unchanged and shared E2E already exercises those endpoints. The test plan's older location/automation TODO is stale; reconcile it during documentation work, not by adding an E2E directory or changing `realworld/`.

**Execution protocol:** Target branch is `feat/GH-1/article-reading-time`; the authorized executor must switch to it, or create it if absent, before implementation. Each implementation phase uses red → green → refactor → focused verification → an explicit Conventional Commit checkpoint. Write tests first; prove feature assertions fail for the intended reason before changing production behavior. Existing-behavior characterization tests may already pass and must not be represented as red evidence. Stage only intended files at each checkpoint; commits below are future execution instructions, not actions taken while authoring this plan.

### Open questions

- Nonempty image alt text and fenced language labels have no specified counting oracle. Use empty-alt images and unlabeled fences for exact-count tests; retain the practical-syntax scope rather than expanding requirements. PM/engineering owns any requested clarification.
- `package.json` is private and currently `0.0.0`, with no release script. Confirm the repository's version authority before release. The concrete manifest minor increment is `0.1.0` if the package version is the release version; otherwise record the established release mechanism and apply its minor bump. Engineering owns this release question.
- External-service approval, Chromium/backend availability, and a representative performance machine must be confirmed at execution. These are conditional evidence prerequisites, not observed failures.

## Scope

### In Scope

- **F-1:** Whole minutes, `Math.max(1, Math.ceil(wordCount / 200))`, practical Markdown syntax exclusions, pure deterministic behavior, and long-body measurement.
- **F-2:** Pure `readingTime` pipe producing exactly `X min read`; sibling `.reading-time` after `.date` inside `.info`.
- **F-3:** Real meta, preview, and both article-page occurrences tested for presence/absence and updates.
- **F-4 / DM-1:** `body?: string`, minimal consumer adjustment, cast-free omitted-body fixtures, build and editor preservation checks.
- **NFR-1–3:** Less than 5 ms per 10,000-word calculation on a representative machine, no side effects, zero feature-added requests.
- Co-located Vitest coverage, existing shared non-security E2E, manual checks, documentation reconciliation, and release gates.

### Out of Scope

- API/backend or persisted data changes; fetching detail bodies for previews; configurable WPM; i18n/pluralization variants; exhaustive Markdown parsing.
- New E2E tests, local E2E discovery/configuration changes, `realworld/` edits or submodule-pointer changes. TC-READTIME-012 is N/A, not a pending implementation task.
- Security E2E suite unless scope becomes security-sensitive; unrelated form/service refactors and new system-spec scaffolding.

### Constraints

- Preserve `.article-meta`, `.info`, `.author`, `.date`, links, projected content, and `window.__conduit_debug__`.
- Use Angular TestBed + jsdom and shared `src/test-setup.ts`; import Vitest APIs explicitly. New executable tests must be `src/**/*.spec.ts`.
- Never send live requests in unit tests. Use controlled observables, service spies, or existing HttpTestingController conventions; verify unexpected HTTP requests after each HTTP test.
- Run external-service E2E/manual checks only with approval. No destructive setup without a dedicated approved environment; do not record credentials.
- Planning write scope is this file only. Implementation documentation, code, test evidence, release edits, and checkpoint commits belong to subsequent authorized execution.

### Risks

- **RSK-1:** Heuristic Markdown stripping can inflate/erase content. Mitigate with independently counted, boundary-padded fixtures for every listed syntax family; retain code content and avoid unspecified bare-URL rules.
- **RSK-2:** Shared E2E selectors/layout may break. Add only the sibling element, assert existing DOM/links/projection, visually inspect placement, and run shared regressions.
- **RSK-3:** Optional body can cause compilation/runtime fallout. Inspect `.body` usages and whole-article form patching; normalize only the Markdown call site and test relevant consumers.
- **RSK-4:** Current previews legitimately show no estimate. Assert missing-body behavior; document the API limitation rather than introduce N+1 requests.
- Timing noise and unavailable E2E infrastructure can leave evidence inconclusive. Record raw attempts, actual blockers, remaining criteria, and engineering/PM disposition; never label fallback as E2E success.

### Success Metrics

- Every loaded body-present article page has exactly one correct estimate in each of its two meta blocks.
- All specified boundary, Markdown, formatting, visibility, and compatibility tests are discovered and pass; existing unit/E2E suites have zero regressions when executed.
- Zero added requests, deterministic results, and recorded representative 10,000-word latency below 5 ms for each measured call.
- Missing-body previews have zero estimate elements/placeholders; empty bodies show `1 min read`.

## Phases

### Phase 1: Pure calculation and formatting

**Goal**: Implement F-1 and the reusable formatting part of F-2 without touching article UI or HTTP.

**Tasks**:

- [x] **1.1** Create `reading-time.pipe.spec.ts` first. Define `const words = (n: number) => Array(n).fill('word').join(' ');`. Use table-driven assertions for 200→1, 201→2, 400→2, 401→3, 10,000→50; repeat separators with tabs/newlines/repeated spaces. Assert empty, whitespace-only, one-word, and short inputs return 1. (29 tests include boundaries/minimum/separators; zone.js was temporarily installed locally with `bun add --no-save` to satisfy pre-existing test setup; no manifest or lockfile change.)
- [x] **1.2** Write boundary-padded Markdown cases from test-plan section 6: unlabeled backtick fences, inline backticks, links/empty-alt images, headings, emphasis, blockquotes, unordered/ordered list markers, HTML tags, horizontal rules, combined syntax, and syntax-only bodies. Pad each independently known content count to 200 words, then append one word and expect 2. Preserve code/content/link text. Do not use the production stripping function to calculate expected counts. (Independent fixtures; first red run identified boundary fixture construction mistakes, corrected before final pass.)
- [x] **1.3** Write pipe cases for `1 min read`, `2 min read`, `3 min read`, `50 min read`, empty and whitespace-only strings; repeat/interleave function inputs to expose shared mutable state. Run `bunx vitest run src/app/shared/pipes/reading-time.pipe.spec.ts` and record expected failures for the absent exports/behavior. (Initial run was blocked by absent installed optional peer `zone.js`; after local no-save install, focused tests ran and exposed expected assertions while implementation was being completed.)
- [x] **1.4** Implement the exports below and a minimal ordered stripping pipeline: fenced marker lines and rules first, Markdown link/image destinations while retaining text, HTML tags, line-leading heading/quote/list markers, inline backticks and emphasis delimiters, then whitespace tokenization. Keep syntax removal from concatenating distinct words. Do not remove whole code blocks, all bare URLs, or content merely because it resembles punctuation. (Implemented in `reading-time.pipe.ts`; focused spec now passes.)
- [x] **1.5** Rerun the focused spec, refactor only with green tests, review purity/no injected collaborators, and checkpoint the two intended files. (29/29 passed; source is pure/no collaborators. Checkpoint pending phase close.)

Public calculation signature: `readingTime(body: string): number`. Implement the ordered stripping and tokenization contract in task 1.4 against the independent boundary fixtures. The formatting implementation is:

```ts
@Pipe({ name: 'readingTime', standalone: true, pure: true })
export class ReadingTimePipe implements PipeTransform {
  transform(body: string): string {
    return `${readingTime(body)} min read`;
  }
}
```

Concrete boundary-test shape:

```ts
it.each([
  [200, 1],
  [201, 2],
  [400, 2],
  [401, 3],
  [10000, 50],
])('should calculate %i words as %i minutes', (count, minutes) => expect(readingTime(words(count))).toBe(minutes));
it('should exclude heading syntax at the rounding boundary', () => {
  const body = `${words(198)}\n## alpha beta`;
  expect(readingTime(body)).toBe(1);
  expect(readingTime(`${body} gamma`)).toBe(2);
});
```

**Acceptance Criteria**:

- Must: AC-F-1-1, AC-F-1-2 and computation/pipe portions of AC-F-1-3 pass; code content remains counted; output is exact.
- Must: NFR-2; pipe is explicitly pure and has no side effects or shared mutable state.
- Should: Keep one focused source module and its co-located spec; no dependencies added.

**Files and modules**:

- `src/app/shared/pipes/reading-time.pipe.ts` (new: function and pipe).
- `src/app/shared/pipes/reading-time.pipe.spec.ts` (new: TC-READTIME-001–004, 008; functional long-body coverage).

**Tests**:

- `bunx vitest run src/app/shared/pipes/reading-time.pipe.spec.ts` — fail before implementation, all functional cases pass after it.
- Performance timing is recorded in Phase 6, not a noisy mandatory wall-clock assertion in every unit-suite run.

**Completion signal**: `feat(article): add pure reading-time calculation and pipe`.

### Phase 2: Optional-body contract and consumer preservation

**Goal**: Deliver F-4 with the smallest required compatibility change before adding UI.

**Tasks**:

- [x] **2.1** Add a cast-free `Article` list fixture omitting `body` in `articles.service.spec.ts`; verify list/feed controlled responses preserve omission and existing request shapes. Characterize editor owner-load behavior with a body-present article: original body, tags, and other form values are populated unchanged. Add an omitted-body load case verifying the initial empty body control stays safe; avoid changing write semantics. (Omission fixture + editor tests; omitted body initially yielded undefined, and was normalized with a minimal form fallback.)
- [x] **2.2** Inspect `\.body` usages with the content-search tool, and inspect whole-object flows such as `patchValue(article)`. Distinguish HTTP request bodies and comment bodies from Article consumers. Run focused service/editor specs and `bun run build` before the model edit; use compiler/type-contract evidence for required-body incompatibility rather than claiming Vitest type-checks fixtures. (Search inspected usages and `patchValue`; command sequence deviated: build/test evidence collected after contract/template edits, not before. The distinction and no type-check claim are maintained.)
- [x] **2.3** Change the model to `body?: string`. At the article-page Markdown call site use `[innerHTML]="(a.body ?? '') | markdown | async"` because the existing pipe takes `string`. Keep `MarkdownPipe` itself and preview markup unchanged. Leave editor/services unchanged unless a failing preservation test or compilation error proves a narrow correction necessary. (Optional contract/template fallback; editor body normalization justified by failing preservation test; service unchanged.)
- [x] **2.4** Run the focused specs and build; verify the omitted-body fixture compiles, original article content still renders, and create/update HTTP payload tests remain intact. Checkpoint only the model, call-site change, tests, and any demonstrated minimal fallout fix. (`bun run build` passed; editor 2/2 and service 16/16 pass; HTTP payload expectations remain unchanged.)

**Acceptance Criteria**:

- Must: F-4 / DM-1 uses optional string, not required string or a widened null model; no consumer type errors.
- Must: AC-NFR-1-1 preservation coverage for editor, service writes, and normal detail content; no new API request or behavior change for existing complete articles.

**Files and modules**:

- `src/app/features/article/models/article.model.ts` (updated).
- `src/app/features/article/pages/article/article.component.html` (updated only at Markdown input).
- `src/app/features/article/services/articles.service.spec.ts` (updated: omitted-body controlled list/feed fixtures).
- `src/app/features/article/pages/editor/editor.component.spec.ts` (new: form-population preservation).
- `src/app/features/article/pages/editor/editor.component.ts`, `src/app/features/article/services/articles.service.ts`, `src/app/shared/pipes/markdown.pipe.ts` (inspection; changes only if demonstrated necessary).

**Tests**:

- `bunx vitest run src/app/features/article/services/articles.service.spec.ts src/app/features/article/pages/editor/editor.component.spec.ts` — existing request expectations and editor population pass.
- `bun run build` — optional-body consumers and strict templates compile successfully; Vitest alone is not compilation proof.

**Completion signal**: `fix(article): handle optional article bodies without changing consumers`.

### Phase 3: Shared metadata display

**Goal**: Implement F-2/F-3 once in the shared component, preserving existing metadata and projected actions.

**Tasks**:

- [x] **3.1** Create `article-meta.component.spec.ts` using the real standalone meta and pipe, `provideRouter([])`, fixed author/timestamp data, and explicit Vitest imports. Use `fixture.componentRef.setInput('article', value)` and `fixture.detectChanges()` for OnPush updates. Cover omitted/undefined/null bodies, empty/whitespace/short strings, and 401 words. Model null only as a narrow runtime-boundary fixture assertion; do not cast normal omitted-body fixtures. (8 meta scenarios include absent and present body cases.)
- [x] **3.2** Assert zero `.reading-time` elements and no placeholder for absent bodies; one correctly formatted element for present bodies; sibling placement after `.date` inside `.info`; unchanged formatted date, author links/image, and projected actions. Add absent→present→different length→absent input transitions. Run `bunx vitest run src/app/features/article/components/article-meta.component.spec.ts`; present-body expectations must fail against current markup. (Meta spec passed after fixing TestBed module reset in harness.)
- [x] **3.3** Import `ReadingTimePipe` into the component's standalone imports and insert only this block after the existing date span:

```html
@if (article.body != null) {
<span class="reading-time">{{ article.body | readingTime }}</span>
}
```

- [x] **3.4** Rerun meta and pipe specs; verify projected content and selectors remain intact, no service/request dependency is introduced, and checkpoint the component and new test. (Included in passing 44-case focused UI/pipe set; commit at phase checkpoint.)

**Acceptance Criteria**:

- Must: AC-F-1-2, AC-F-3-1, and meta portions of AC-F-1-3; empty string shows, null/undefined hide, OnPush input changes update correctly.
- Must: Existing `.date`/author markup is preserved; the new element is a sibling, not a replacement/wrapper.
- Should: Keep the existing OnPush and standalone patterns without custom change-detection plumbing.

**Files and modules**:

- `src/app/features/article/components/article-meta.component.ts` (updated: import and guarded sibling only).
- `src/app/features/article/components/article-meta.component.spec.ts` (new).

**Tests**:

- `bunx vitest run src/app/features/article/components/article-meta.component.spec.ts src/app/shared/pipes/reading-time.pipe.spec.ts` — all show/hide, formatting, transition, and preservation assertions pass.

**Completion signal**: `feat(article): display reading time beside article dates`.

### Phase 4: Preview and article-page integration coverage

**Goal**: Prove the shared change reaches real consumers and adds zero requests; avoid duplicate feature logic.

**Tasks**:

- [x] **4.1** Create `article-preview.component.spec.ts` with the real preview/meta/pipe composition and controlled favorite/auth dependencies. Set the actual input name `articleInput`. Assert cast-free omitted-body previews hide the estimate, empty body shows `1 min read`, and 201 words shows `2 min read`; verify title, description, author/date, navigation, and projected favorite button remain intact. (4 preview tests passed; feature has no preview fetch collaborator.)
- [x] **4.2** Create `pages/article/article.component.spec.ts` with real page/meta templates. Provide `ActivatedRoute.snapshot.params.slug`, controlled `ArticlesService.get`, `CommentsService.getAll`, and `UserService.currentUser` emissions. Use a body-present fixture with 401 words and an empty-body variant through normal `ngOnInit` loading. Settle fixture async work, including Markdown's async pipe. Assert separately `.banner app-article-meta .reading-time` and `.article-actions app-article-meta .reading-time`, exactly one each, correct identical text, and preserved dates/actions. Include an omitted-body page fixture to verify safe Markdown fallback and no estimate. (3 page cases passed.)
- [x] **4.3** Add TC-READTIME-010 request-boundary assertions: a list query retains its existing request shape and does not request detail bodies; preview rendering and input updates call no body-fetch service; page load calls `get(slug)` and `getAll(slug)` once and repeated detection/two meta blocks cause no extra calls. Use service spies or HttpTestingController with controlled responses and verification, never live HTTP. (Service list omission/request assertions retained; component spec asserts get/getAll once.)
- [x] **4.4** Run both integration specs before any further production edit. They should already pass after Phase 3: these are integration-preservation proofs, not fabricated red results. If a real integration defect is exposed, retain the failing test, make only the necessary consumer correction, rerun, and checkpoint the tests/fix. (Focused pipe/meta/preview/page run 44/44; build passed. Editor omission failure prompted a test-backed minimal normalization and editor/service focused specs passed.)

**Acceptance Criteria**:

- Must: AC-F-3-1 and AC-F-2-1 cover real preview and both distinct page occurrences, including present-empty bodies.
- Must: NFR-3 has controlled request-count evidence; no new fetching, page-specific reading-time logic, or preview estimate fallback.
- Should: Leave preview and page production code unchanged beyond Phase 2's Markdown fallback unless tests demonstrate a defect.

**Files and modules**:

- `src/app/features/article/components/article-preview.component.spec.ts` (new).
- `src/app/features/article/pages/article/article.component.spec.ts` (new).
- `src/app/features/article/services/articles.service.spec.ts` (existing controlled list/detail HTTP coverage, updated only if coverage requires it).
- `src/app/features/article/components/article-preview.component.ts`, `src/app/features/article/pages/article/article.component.ts`, `src/app/features/article/pages/article/article.component.html` (integration targets; no duplicate display logic).

**Tests**:

- `bunx vitest run src/app/features/article/components/article-preview.component.spec.ts src/app/features/article/pages/article/article.component.spec.ts src/app/features/article/services/articles.service.spec.ts` — page placement, preview response-shape behavior, existing content, and request boundaries pass.

**Completion signal**: `test(article): cover reading-time integration and request preservation`.

### Phase 5: Documentation synchronization and review/fix loop

**Goal**: Reconcile planning artifacts and analyze implementation against every criterion before release; merge the small documentation/review/conditional-fix phases. Per user directive, Phase 5.1 updates only these change artifacts; repository system-spec reconciliation is deferred to @doc-syncer later.

**Tasks**:

- [x] **5.1** Update the change test plan to reference this plan and actual function/spec location, reflect TC-READTIME-012 as N/A per PM notes throughout its scenario tables/open questions/log, and remove the obsolete local-E2E tooling assumption. Preserve failed/blocked evidence and remaining non-blocking counting clarifications. Document current list-preview behavior and unchanged endpoints; do not create a new system specification solely for this change. (Plan/test-plan links and actual files reconciled; 012 N/A and 5.1 scope limited to change artifacts, per user directive.)
- [ ] **5.2** Perform Code Review (Analysis) against F-1–F-4, all six ACs, NFR-1–3, and RSK-1–4. Inspect Markdown boundary oracles, purity, optional-body consumers, template sibling placement, OnPush transitions, page composition, unchanged HTTP contracts, and read-only submodule/debug compatibility. Record findings and criterion coverage in this plan's execution log. (Reviewer agent dispatch unavailable in this runtime due subagent-depth limit. Local inspection was done, but no independent reviewer PASS is available; remains open.)
- [ ] **5.3** If findings require fixes, first add a failing focused regression test for each behavioral defect, run it red, implement the minimal fix, then rerun affected tests and review until PASS. Record findings, tests, and disposition; if none, record post-review fixes as Not required. Escalate an actual architectural departure as **Decision needed: consult `@architect`**, recording an ADR link before implementing that departure.
- [x] **5.4** Recheck artifact consistency and run focused affected specs plus formatting checks for changed documents; checkpoint reconciled documentation and any demonstrated fixes. Do not claim performance/E2E success before Phase 6 evidence exists. (Focused feature/UI test group 44 passed, editor 2/2, service 16/16; `bun run format` and `bun run format:check` passed. Review task remains open.)

**Acceptance Criteria**:

- Must: Every spec requirement has an implementation/evidence path; reviewer returns PASS with no unresolved remediation tasks.
- Must: TC-READTIME-012 no longer drives unauthorized new automation; test-plan mappings reflect actual source layout.
- Must: Conditional fixes have regression evidence and do not expand scope. Spec reconciliation cannot weaken acceptance criteria to hide a failure.

**Files and modules**:

- `.samourai/docai/changes/2026-10/2026-10-06--GH-1--article-reading-time/chg-GH-1-test-plan.md` (future authorized documentation reconciliation/evidence).
- `.samourai/docai/changes/2026-10/2026-10-06--GH-1--article-reading-time/chg-GH-1-spec.md` (future authorized tooling-reference reconciliation if needed, no behavior change).
- This implementation plan (execution/review findings).
- Only source/spec files directly implicated by an actual review finding (conditional fixes).

**Tests**:

- Run each affected file with `bunx vitest run` followed by its exact spec path; all reviewed lower-layer tests must pass.
- `bun run format:check` — identify formatting issues before the final formatting/release pass.

**Completion signal**: `docs(article): reconcile reading-time delivery and review evidence`; conditional code fixes get a separate `fix(article): address reading-time review findings` checkpoint before it.

### Phase 6: Final verification and release

**Goal**: Collect full quality/performance/manual evidence and reconcile the spec. Per PM decision, skip package version bump because `package.json` is `0.0.0` for this unversioned unreleased example app; preserve no migration/flag behavior.

**Tasks**:

- [x] **6.1** Confirm version authority and perform the required minor version bump per repository conventions. If `package.json` is authoritative, change `0.0.0` to `0.1.0` and update lockfile metadata only if the installed tooling requires it; otherwise record/apply the established minor release mechanism. Reconcile the final implementation and documentation against the canonical spec and resolved decisions; record no migration, no flags, and no breaking API change. (Skipped per PM decision (pm-notes): package.json 0.0.0, unversioned example app. package.json unchanged.)
- [x] **6.2** Run `bun run format`, inspect the resulting diff and retain only intended change files, then run `bunx vitest run`, `bun run build`, and `bun run format:check`. Require exit success for all three and verify function/pipe/meta/preview/page/editor cases are discovered, not skipped. Include existing article/auth/profile/comment tests; record commands and outcomes in the test execution log. (Final `bun run format:check` passed; final `bunx vitest run` passed 11 files/228 tests; final `bun run build` succeeded. No `package.json` version change.)
- [x] **6.3** Measure TC-READTIME-009 with a focused developer-machine harness alongside the pipe spec: preconstruct a 10,000-word body, verify 50 minutes, warm up, then time 100 individual calls with `performance.now()`. Exclude fixture generation/startup/rendering. Record runtime/hardware, sample distribution and maximum, and any repeat attempts. Require each representative measured calculation below 5 ms; investigate recurring breaches. Keep functional long-body assertions in the normal suite; unsuitable machine results are Inconclusive, not Passed. (Repeat focused run: Node v22.17.1 Linux/x64; median 1.1249ms, max 4.0493ms, all 100 under 5ms. Another test-suite-loaded attempt produced a 5.1604ms outlier, 99/100 under; timing noise documented.)
- [x] **6.4** With Chromium, reachable `https://api.realworld.show/api`, and external-service approval, run the existing `bun run test:e2e` suite. Do not modify shared tests, submodule pointer, or browser configuration to manufacture a pass. TC-READTIME-012 remains N/A; no new E2E test is needed. (Approved E2E attempted with Chromium installed once, but both attempts failed before running tests because configured webServer couldn't bind port 4200 already occupied by `ng serve`; see test plan. E2E remains FAILED infrastructure, not passed.)
- [x] **6.5** Complete feasible manual checks from the test plan: both page meta blocks/date adjacency/actions; controlled empty-body article; current home/tag/profile/favorite lists without estimates; controlled body-present preview with the correct value; browser Network comparison showing zero feature-added/duplicate/per-preview detail requests; editor body population if adjusted. Record unavailable manual flows separately. (Home feed has 4 previews and zero estimates; Network shows only `GET /api/articles?limit=10&offset=0`. Two public articles each showed equal `1 min read` after dates in both page meta blocks and actions preserved; each page had only its ordinary article + comments requests. No empty-body article exists in backend; local controlled unit test covers. Body-present preview and tag/profile/favorite list variants not performed. Editor route redirects to `/login` without approved demo account, so manual editor not run.)
- [x] **6.6** If E2E prerequisites/approval are unavailable or execution fails for infrastructure reasons, retain full unit/build/format results, targeted integration/network tests, and feasible manual checks. Record `bun run test:e2e` as Blocked/Not run or Failed as observed, the actual missing prerequisite/error, unverified E2E portion of AC-NFR-1-1, engineering as rerun owner, and required PM/human disposition in the test plan. Do not relabel lower-layer checks as E2E success or silently accept the gap. (Attempts and root cause recorded; E2E assertions did not execute and residual AC-NFR-1-1 verification remains unresolved.)
- [ ] **6.7** Reconcile every AC/NFR and review finding with recorded evidence, update execution logs, confirm no unintended files or `realworld` pointer changes, and checkpoint release/version/evidence files only. Release readiness requires all evidence or explicit PM/human acceptance of documented residual gaps; a blocker without that disposition is not completion. Hand off for normal client-release/human review; do not open or merge a PR in this planning task. (Currently blocked by pending external E2E disposition, full format/build/test rerun after performance addition, and review task; not claimed complete.)

**Acceptance Criteria**:

- Must: AC-F-1-3 and AC-NFR-1-1 have full suite/build/format evidence and existing E2E success, or an explicitly recorded unresolved/accepted E2E disposition—not a false pass.
- Must: NFR-1–3 evidence is recorded; all functionality and optional-body preservation remain green after release edits.
- Must: Minor version handling and final spec reconciliation are complete; no flags, migration, backend changes, or outstanding review fixes.

**Files and modules**:

- `package.json` (minor release version if authoritative); existing lockfile only if required by repository tooling.
- `src/app/shared/pipes/reading-time.pipe.spec.ts` (focused performance harness/functional long-body coverage).
- Change test plan and this plan (quality, manual, performance, release, and fallback evidence).
- Change spec and existing related documentation (final reconciliation only where needed).
- `realworld/specs/e2e/`, `playwright.config.ts`, and debug interface (read-only regression targets).

**Tests**:

- `bunx vitest run` — full unit/component/service suite passes with required cases discovered.
- `bun run build` — successful compilation/bundling with optional-body templates.
- `bun run format:check` — passes after formatting and final artifact edits.
- Focused timing harness — 50-minute result and representative per-call latency below 5 ms.
- `bun run test:e2e` — shared non-security suite passes, or documented fallback/disposition remains explicit.

**Completion signal**: `chore(release): finalize article reading-time minor release` with gate/evidence status recorded; if an evidence gap remains unaccepted, record Blocked and do not claim release completion.

## Test Scenarios

| Scenario        | Verification                                                                                                      | Phases  | Spec traceability                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------- |
| TC-READTIME-001 | 200/201/400/401/10,000 words and equivalent whitespace separators                                                 | 1       | AC-F-1-1, AC-F-1-3                 |
| TC-READTIME-002 | Empty/whitespace/short bodies return and display one minute                                                       | 1, 3, 4 | AC-F-1-2, AC-F-1-3                 |
| TC-READTIME-003 | Each practical Markdown syntax family, independent 200/201-word boundary padding, combined and syntax-only bodies | 1       | AC-F-1-1, AC-F-1-3, RSK-1          |
| TC-READTIME-004 | Real pure pipe returns exact 1/2/3/50-minute labels                                                               | 1       | F-2, AC-F-1-2, AC-F-1-3            |
| TC-READTIME-005 | Meta null/undefined/omitted hide, empty shows, sibling/date/author/projection preserved, OnPush transitions       | 3       | AC-F-3-1, AC-F-1-3, RSK-2          |
| TC-READTIME-006 | Real preview with cast-free omitted body, empty body, and 201-word body                                           | 2, 4, 6 | AC-F-3-1, F-4, DM-1                |
| TC-READTIME-007 | Normal page load gives one matching estimate in banner and bottom actions, including empty body                   | 4, 6    | AC-F-2-1                           |
| TC-READTIME-008 | Repeated/interleaved inputs and side-effect/shared-state review                                                   | 1, 5    | NFR-2                              |
| TC-READTIME-009 | Warmed 100-call timing, prebuilt 10,000-word fixture, individual results and machine recorded                     | 6       | NFR-1                              |
| TC-READTIME-010 | Controlled list/detail boundaries, no preview fetch, no second-meta duplicate request, browser Network evidence   | 2, 4, 6 | NFR-3, AC-NFR-1-1                  |
| TC-READTIME-011 | Optional-body compile/editor preservation, full suite/build/format, existing E2E or explicit fallback             | 2, 5, 6 | AC-F-1-3, AC-NFR-1-1, DM-1         |
| TC-READTIME-012 | N/A per PM decision: unchanged endpoints, existing shared E2E, no new automation                                  | 5, 6    | Existing HTTP contracts; no new AC |

## Artifacts and Links

Paths below are repository-relative unless prefixed with `./`.

| Artifact                    | Location                                                                                                                              | Type                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Canonical change spec       | [chg-GH-1-spec.md](./chg-GH-1-spec.md)                                                                                                | Source of truth                                      |
| Change test plan            | [chg-GH-1-test-plan.md](./chg-GH-1-test-plan.md)                                                                                      | Scenario details, fixtures, evidence/fallback        |
| PM decisions                | [chg-GH-1-pm-notes.yaml](./chg-GH-1-pm-notes.yaml)                                                                                    | Resolved TC-READTIME-012 and preview/model decisions |
| Testing strategy            | [testing-strategy.md](../../../../ai/rules/testing-strategy.md)                                                                       | Required layers and gates                            |
| Structural template         | `.samourai/core/templates/implementation-plan-template.md`                                                                            | Plan structure                                       |
| Calculation/pipe and tests  | `src/app/shared/pipes/reading-time.pipe.ts`, `src/app/shared/pipes/reading-time.pipe.spec.ts`                                         | New pure implementation and coverage                 |
| Article contract            | `src/app/features/article/models/article.model.ts`                                                                                    | Optional body                                        |
| Shared meta and tests       | `src/app/features/article/components/article-meta.component.ts`, `src/app/features/article/components/article-meta.component.spec.ts` | Conditional sibling display                          |
| Preview integration tests   | `src/app/features/article/components/article-preview.component.spec.ts`                                                               | Real consumer composition                            |
| Page template/tests         | `src/app/features/article/pages/article/article.component.html`, `src/app/features/article/pages/article/article.component.spec.ts`   | Markdown fallback and both meta occurrences          |
| Editor/service preservation | `src/app/features/article/pages/editor/editor.component.spec.ts`, `src/app/features/article/services/articles.service.spec.ts`        | Form and request contracts                           |
| Existing shared E2E         | `realworld/specs/e2e/`                                                                                                                | Read-only regression suite                           |
| Release manifest            | `package.json`                                                                                                                        | Version authority to confirm                         |
| Ticket                      | https://github.com/opensourceMS/angular-realworld-example-app/issues/1                                                                | Work item                                            |

No ADR is required by the specified local function/pipe design. A departure requiring architecture approval must receive an actual ADR reference during execution; none is fabricated here.

## Plan Revision Log

| Version | Date (UTC) | Author      | Changes                                                                                                                                                                                                                                                                        |
| ------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0     | 2026-10-06 | plan-writer | Initial six-phase TDD-oriented plan from canonical spec/template, test strategy, and PM decisions; includes optional-body Markdown fallout, preservation/integration coverage, TC-READTIME-012 N/A, review/fix loop, minor release handling, and explicit final-gate fallback. |

## Execution Log

Planning only. No implementation, tests, quality gates, branch operation, or commit was performed by the plan writer. Repository permissions prohibit this role from executing commands/committing; the authorized executor owns those operations. Only this plan file is written. No runtime/performance/E2E pass is implied by this document.

| Phase | Status      | Started    | Completed  | Commit  | Notes                                                   |
| ----- | ----------- | ---------- | ---------- | ------- | ------------------------------------------------------- |
| 1     | Completed   | 2026-10-06 | 2026-10-06 | 924e1d7 | Pure function and pipe; 29 tests passed                 |
| 2     | Completed   | 2026-10-06 | 2026-10-06 | a1ec8ad | Optional-body model; page/editor fallbacks and tests    |
| 3     | Completed   | 2026-10-06 | 2026-10-06 | 11a6909 | Conditional date-adjacent meta display                  |
| 4     | Completed   | 2026-10-06 | 2026-10-06 | 2f98347 | Preview/page integration and request preservation tests |
| 5     | In progress | 2026-10-06 | —          | 2ad076a | Docs reconciled; independent review unavailable         |
| 6     | Blocked     | 2026-10-06 | —          | —       | PM version skip; E2E port conflict; disposition pending |

Execution notes: Repository profile absent. Architecture consultation tool could not dispatch due platform subagent-depth limit; source inspection found no architectural departure or ADR requirement. UI consultation tool had the same limit; no styling/system changes were planned, and the sibling in `.info` follows existing metadata hierarchy. Current in-flight work crosses phase commits because integration/release verification exposed the existing duplicate Angular TestBed initialization in five legacy service specs; those specs were adjusted to use configured `src/test-setup.ts` to unblock the explicit full-suite gate. All other unrelated untracked/user modifications remain unstaged.

### Final acceptance evidence (2026-10-06)

- AC-F-1-1 / AC-F-1-2 — PASSED: threshold/minimum/Markdown/format assertions in full suite.
- AC-F-3-1 — Automated PASSED; manual PARTIAL: component tests cover body absence/presence; home feed manual showed four list previews without estimate. Live body-present preview not found.
- AC-F-2-1 — PASSED automated and manual on two public article pages; both meta locations had matching date-adjacent text and preserved actions.
- AC-F-1-3 — PASSED: all required function/pipe/meta tests discovered in full suite.
- AC-NFR-1-1 — PARTIAL: 228 unit tests, build and format pass; E2E test cases never started due port-4200 conflict. PM/human disposition required; no E2E success asserted.
- F-4 / DM-1 — PASSED: optional Article body compiles; editor fallback behavior and service payload preservation tested.
- NFR-1 — PARTIAL/noisy: one focused benchmark passed 100/100 under threshold (max 4.0493 ms); an additional attempt during suite load had a 5.1604 ms outlier (99/100 under). Repeat on a representative idle machine if required.
- NFR-2 — PASSED: determinism tests and pure local implementation.
- NFR-3 — PASSED in controlled component/service tests and partial browser Network observations; no list-body or repeated-meta detail fetch observed.
- Review/PASS and final acceptance remain unvalidated; independent reviewer agent unavailable in the current tool runtime.
