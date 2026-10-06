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
- [x] **5.2** Perform Code Review (Analysis) against F-1–F-4, all six ACs, NFR-1–3, and RSK-1–4. Inspect Markdown boundary oracles, purity, optional-body consumers, template sibling placement, OnPush transitions, page composition, unchanged HTTP contracts, and read-only submodule/debug compatibility. Record findings and criterion coverage in this plan's execution log. (Independent review iteration 2: PASS on 2026-10-06; all three iteration-1 findings resolved. See `code-review/review-iter-2.md`.)
- [x] **5.3** If findings require fixes, first add a failing focused regression test for each behavioral defect, run it red, implement the minimal fix, then rerun affected tests and review until PASS. Record findings, tests, and disposition; if none, record post-review fixes as Not required. Escalate an actual architectural departure as **Decision needed: consult `@architect`**, recording an ADR link before implementing that departure. (Phase 7 remediation in `eb2f9a7`, documentation in `729a675`; regression evidence recorded below and independently re-reviewed PASS. No architecture departure.)
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
- [x] **6.2** Run `bun run format`, inspect the resulting diff and retain only intended change files, then run `bunx vitest run`, `bun run build`, and `bun run format:check`. Require exit success for all three and verify function/pipe/meta/preview/page/editor cases are discovered, not skipped. Include existing article/auth/profile/comment tests; record commands and outcomes in the test execution log. (After Phase 7: `bun run format` completed; `bunx vitest run` passed 11 files/231 tests; `bun run build` succeeded; `bun run format:check` passed. No `package.json` version change.)
- [x] **6.3** Measure TC-READTIME-009 with a focused developer-machine harness alongside the pipe spec: preconstruct a 10,000-word body, verify 50 minutes, warm up, then time 100 individual calls with `performance.now()`. Exclude fixture generation/startup/rendering. Record runtime/hardware, sample distribution and maximum, and any repeat attempts. Require each representative measured calculation below 5 ms; investigate recurring breaches. Keep functional long-body assertions in the normal suite; unsuitable machine results are Inconclusive, not Passed. (Repeat focused run: Node v22.17.1 Linux/x64; median 1.1249ms, max 4.0493ms, all 100 under 5ms. Another test-suite-loaded attempt produced a 5.1604ms outlier, 99/100 under; timing noise documented.)
- [x] **6.4** With Chromium, reachable `https://api.realworld.show/api`, and external-service approval, run the existing `bun run test:e2e` suite. Do not modify shared tests, submodule pointer, or browser configuration to manufacture a pass. TC-READTIME-012 remains N/A; no new E2E test is needed. (E2E NOT RUN per user instruction; residual E2E gap explicitly ACCEPTED by user. No E2E success is claimed.)
- [x] **6.5** Complete feasible manual checks from the test plan: both page meta blocks/date adjacency/actions; controlled empty-body article; current home/tag/profile/favorite lists without estimates; controlled body-present preview with the correct value; browser Network comparison showing zero feature-added/duplicate/per-preview detail requests; editor body population if adjusted. Record unavailable manual flows separately. (Home feed 4 previews/zero estimates and only the list request; tag feed 1 preview/zero estimates and one tagged-list request; profile posts 1 preview/zero estimates; profile favorites 2 previews/zero estimates. Two public article pages showed matching 1 min read date-adjacent in both blocks with actions and only normal detail+comments requests. No empty-body article or body-present preview from API; controlled unit tests cover these. Editor route redirects to login without an approved demo account.)
- [x] **6.6** If E2E prerequisites/approval are unavailable or execution fails for infrastructure reasons, retain full unit/build/format results, targeted integration/network tests, and feasible manual checks. Record `bun run test:e2e` as Blocked/Not run or Failed as observed, the actual missing prerequisite/error, unverified E2E portion of AC-NFR-1-1, engineering as rerun owner, and required PM/human disposition in the test plan. Do not relabel lower-layer checks as E2E success or silently accept the gap. (E2E NOT RUN per user instruction; residual AC-NFR-1-1 E2E gap explicitly ACCEPTED by user; lower-layer checks are not represented as E2E.)
- [x] **6.7** Reconcile every AC/NFR and review finding with recorded evidence, update execution logs, confirm no unintended files or `realworld` pointer changes, and checkpoint release/version/evidence files only. Release readiness requires all evidence or explicit PM/human acceptance of documented residual gaps; a blocker without that disposition is not completion. Hand off for normal client-release/human review; do not open or merge a PR in this planning task. (Reconciled: E2E NOT RUN and residual explicitly ACCEPTED by user; review findings remediated; final gates recorded below. Task 6.1 remains skipped per PM; TC-READTIME-012 is N/A. No dev server/E2E run performed.)

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
| 1.1     | 2026-10-06 | reviewer    | First independent review: append Phase 7 for three findings (one major, two minor); preserve PM dispositions and all existing task states. No source modifications or commit.                                                                                                  |
| 1.2     | 2026-10-06 | reviewer    | Review iteration 2 PASS: close Phase 7 and review/fix tasks 5.2/5.3; record independent verification and resolved findings. No new remediation, source modifications, or commit.                                                                                               |

## Execution Log

Planning only. No implementation, tests, quality gates, branch operation, or commit was performed by the plan writer. Repository permissions prohibit this role from executing commands/committing; the authorized executor owns those operations. Only this plan file is written. No runtime/performance/E2E pass is implied by this document.

| Phase | Status    | Started    | Completed  | Commit            | Notes                                                                |
| ----- | --------- | ---------- | ---------- | ----------------- | -------------------------------------------------------------------- |
| 1     | Completed | 2026-10-06 | 2026-10-06 | 924e1d7           | Pure function and pipe; 29 tests passed                              |
| 2     | Completed | 2026-10-06 | 2026-10-06 | a1ec8ad           | Optional-body model; page/editor fallbacks and tests                 |
| 3     | Completed | 2026-10-06 | 2026-10-06 | 11a6909           | Conditional date-adjacent meta display                               |
| 4     | Completed | 2026-10-06 | 2026-10-06 | 2f98347           | Preview/page integration and request preservation tests              |
| 5     | Completed | 2026-10-06 | 2026-10-06 | 2ad076a           | Docs reconciled; review findings handled in Phase 7                  |
| 6     | Completed | 2026-10-06 | 2026-10-06 | TBD               | Version skipped; E2E residual accepted; final gates pass             |
| 7     | Completed | 2026-10-06 | 2026-10-06 | eb2f9a7 / 729a675 | All three findings independently verified resolved; iteration 2 PASS |

Execution notes: Repository profile absent. Architecture consultation tool could not dispatch due platform subagent-depth limit; source inspection found no architectural departure or ADR requirement. UI consultation tool had the same limit; no styling/system changes were planned, and the sibling in `.info` follows existing metadata hierarchy. Current in-flight work crosses phase commits because integration/release verification exposed the existing duplicate Angular TestBed initialization in five legacy service specs; those specs were adjusted to use configured `src/test-setup.ts` to unblock the explicit full-suite gate. All other unrelated untracked/user modifications remain unstaged.

### Final acceptance evidence (2026-10-06)

- AC-F-1-1 / AC-F-1-2 — PASSED: threshold/minimum/Markdown/format assertions in full suite.
- AC-F-3-1 — Automated PASSED; manual PARTIAL: component tests cover body absence/presence; home feed manual showed four list previews without estimate. Live body-present preview not found.
- AC-F-2-1 — PASSED automated and manual on two public article pages; both meta locations had matching date-adjacent text and preserved actions.
- AC-F-1-3 — PASSED: all required function/pipe/meta tests discovered in full suite.
- AC-NFR-1-1 — PARTIAL: full unit suite, build and format pass; E2E test cases not run per user instruction. Residual gap explicitly ACCEPTED by user; no E2E success asserted.
- F-4 / DM-1 — PASSED: optional Article body compiles; editor fallback behavior and service payload preservation tested.
- NFR-1 — PARTIAL/noisy: one focused benchmark passed 100/100 under threshold (max 4.0493 ms); an additional attempt during suite load had a 5.1604 ms outlier (99/100 under). Repeat on a representative idle machine if required.
- NFR-2 — PASSED: determinism tests and pure local implementation.
- NFR-3 — PASSED in controlled component/service tests and partial browser Network observations; no list-body or repeated-meta detail fetch observed.
- Review iteration 2 — PASS: all three iteration-1 findings independently verified resolved; no new findings. See `code-review/review-iter-2.md`.

### Phase 7: Code Review Remediation (Iteration 1)

**Review status (2026-10-06): FAIL** — 3 findings (0 critical / 1 major / 2 minor / 0 nit). See `code-review/findings-iter-1.json` and `code-review/review-iter-1.md`. Repository profile absent; feature/build correctness and regression preservation drove the review.

- [x] **7.1** [major] `src/app/shared/pipes/reading-time.pipe.ts:11` — Replacing every emphasis-like character with whitespace splits literal identifiers and intraword formatting, inflating reading time; fix: add independently counted red regression cases for 199 plain words plus `snake_case`, inline-code `snake_case`, and `pre**fix**` (each must remain 200 words / 1 minute, with an extra word yielding 2). Apply a practical delimiter-aware correction that preserves literal/code content and existing word boundaries without introducing a full Markdown parser. Rerun pipe and real-meta integration tests. (AC-F-1-1; task 1.4.) (Regression evidence: focused spec first failed all 3 cases at 2 minutes; removing emphasis delimiter characters without replacing them with spaces made all 3 boundary pairs pass; focused pipe/meta/preview/page suite passed 48 tests.)
- [x] **7.2** [minor] `src/app/shared/pipes/reading-time.pipe.spec.ts:90` — The benchmark times the Vitest assertion as well as the calculation, and its below-five-ms test name does not match its informational-only result; fix: capture `readingTime(body)`, stop timing, then assert the result. Clearly label default-suite timings as diagnostic rather than a threshold gate; use an explicit focused measurement/disposition for NFR-1 on an identified idle developer machine, retaining outliers and inconclusive runs. Do not add a flaky mandatory shared-suite wall-clock assertion. (NFR-1; task 6.3.) (Timer now stops before the correctness assertion, and the suite message/test name explicitly label these as diagnostic, not NFR-1 acceptance. Prior focused machine evidence and the loaded-suite outlier remain recorded in the Phase 6 execution evidence; no threshold assertion added.)
- [x] **7.3** [minor] `src/app/features/article/pages/article/article.component.spec.ts:64` and `src/app/features/article/components/article-preview.component.spec.ts:51` — Claimed preservation/request evidence is incomplete: the page only checks that the content container exists, and the preview's no-body-fetch test asserts no calls; fix: assert actual asynchronously rendered Markdown content for a present body and an empty inner content element for a genuinely omitted body. Provide controlled preview service dependencies and verify no body-fetch requests across input changes/repeated detection. Complete the planned exact date/author-link/image/projected-action preservation assertions where they are currently only implied by element presence. (Tasks 3.2, 4.1–4.3; AC-NFR-1-1, NFR-3.) (Present body Markdown content and omitted-body empty fallback are asserted in the real page template; preview verifies author link/date/avatar/navigation/projected favorite, present/omitted updates, and zero Article detail-get calls across repeated detection. Focused four-spec integration group passed 48 tests.)

**Verification:** Reviewer reran `bunx vitest run`: 11 files / 228 tests passed. Focused pipe run: 30 tests passed, median 1.0279 ms / max 3.0943 ms / 100 of 100 below 5 ms, with the existing assertion-inclusive timing caveat. Changed feature source/spec formatting checks passed. Independent direct calculation reproduced finding 7.1 without modifying source files.

**Plan audit:** Existing unchecked 5.2/5.3 reflect the review/fix cycle; this review supplies analysis evidence, but no PASS is available until remediation. Task 6.7 remains pending final reconciliation, not blocked by an unaccepted E2E gap: the user has explicitly accepted that residual gap in PM notes. Partial checked-task evidence gaps in 1.4 and 3.2/4.1–4.3 are addressed above. Do not duplicate these tasks in a later remediation phase while they remain open.

**Respected dispositions:** Version bump skipped; E2E assertions did not execute and the residual gap is accepted (6.4/6.6/6.7 may reflect that acceptance without claiming E2E success); TC-READTIME-012 is N/A; no system-spec update required. Legacy service-spec TestBed initialization removal is justified by the pre-existing shared setup and the passing complete suite; no scope finding. Optional-body page/editor fallbacks are narrow and preserve complete-body behavior; no production fallout finding.

**Next step:** Execute Phase 7 with regression-first fixes, rerun affected/full unit tests and build/format gates, reconcile existing review/finalization task evidence, then request review iteration 2. Reviewer made no source changes and no commit.

### Phase 7 execution evidence (2026-10-06)

- Finding 7.1 — RED/GREEN: three independently constructed 200-word boundary cases (`snake_case`, inline-code `snake_case`, `pre**fix**`) failed first at 2 minutes instead of 1; after delimiter removal without inserting spaces, all pass, with the appended-word cases at 2 minutes.
- Finding 7.2 — Timer now encloses only `readingTime(body)`; correctness assertions occur after timing. Shared-suite timing is labelled diagnostic, not NFR-1 acceptance. Prior focused representative-machine results and noisy outlier remain recorded; no new isolated idle-machine run is claimed.
- Finding 7.3 — Real page test asserts asynchronously rendered body Markdown and empty omitted-body fallback, both meta blocks' author links/date/avatar/action preservation. Preview test uses controlled service dependencies and checks metadata, input changes, repeated detection and zero article-detail `get` calls.
- Focused command `bunx vitest run src/app/shared/pipes/reading-time.pipe.spec.ts src/app/features/article/components/article-meta.component.spec.ts src/app/features/article/components/article-preview.component.spec.ts src/app/features/article/pages/article/article.component.spec.ts`: 4 files / 48 tests passed.
- Architecture consultation was attempted but dispatch was unavailable due platform subagent-depth limit. No architecture departure was required; no ADR needed.
- User dispositions: 6.4/6.6/6.7 closed with E2E NOT RUN and residual AC-NFR-1-1 gap explicitly ACCEPTED; 6.1 remains skipped per PM; TC-READTIME-012 remains N/A. No E2E or dev-server command was run during this execution.
- Final quality gates: `bunx vitest run` PASS (11 files / 231 tests); `bun run build` PASS (Angular bundle generated); `bun run format` PASS; `bun run format:check` PASS (all matched files formatted). No E2E is claimed.
- Historical executor handoff: committer dispatch was unavailable at that time. Subsequently, remediation was committed in `eb2f9a7` and documentation in `729a675`; independent review iteration 2 closes the phase below. Reviewer creates no commit.

### Review iteration 2 / Phase 7 closeout (2026-10-06)

**Status: PASS. Phase 7: Completed. Findings: 0 (0 critical / 0 major / 0 minor / 0 nit).** No additional remediation phase or tasks required. The iteration-1 FAIL entry above remains historical evidence, superseded by this closeout.

- Finding 7.1 resolved: emphasis-character removal no longer inserts word boundaries; independent 200/201-word regression pairs cover literal identifiers, inline code, and intraword formatting. Existing syntax-family, whitespace, minimum, and long-body tests remain green. Removing literal punctuation does not alter whitespace-token counts for those words; exhaustive Markdown parsing is not required.
- Finding 7.2 resolved: timing ends before the correctness assertion, and the test/output explicitly identify diagnostic measurements rather than a mandatory threshold gate. Reviewer focused measurement on Node v22.17.1, Linux/x64, Intel Core i7-1365U (virtualized environment): median 0.5625 ms, maximum 2.6541 ms, 100/100 below 5 ms. This supports NFR-1 alongside the retained earlier measurements; no universally idle-machine guarantee or shared-suite timing gate is claimed, and the earlier 5.1604-ms loaded-suite outlier remains recorded.
- Finding 7.3 resolved: real page content is asserted after async rendering; absent-body rendering is safe; exact dates, author links, avatars, and projected favorite components are checked. Preview service dependencies are controlled, and zero detail fetches are asserted through absent/present/absent updates and repeated detection.
- Reviewer commands: `bunx vitest run` PASS (11 files / 231 tests); focused pipe command PASS (33 tests); Prettier check for remediation source/spec files PASS. Coder-reported build and full-format success retained; not independently rerun. No source, debug-interface, API, or submodule-pointer regression found in the reviewed diff.
- Plan status: ALL_TASKS_DONE after closing 5.2/5.3 and Phase 7. No OPEN_TASKS, DONE_BUT_UNCHECKED, or CHECKED_BUT_MISSING gaps remain for this review. E2E remains unexecuted with the explicit user-accepted residual gap; version skip, TC-READTIME-012 N/A, and no system-spec update remain respected.
- Next step: PROCEED to PM quality/DoD and human review. Reviewer changed only this plan and iteration-2 review artifacts, preserved pre-existing workspace modifications, and did not commit.
