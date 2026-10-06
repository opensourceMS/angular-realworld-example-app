# GH-1 — Review iteration 1

- Date: 2026-10-06
- Status: **FAIL**
- Findings: **3** (0 critical / 1 major / 2 minor / 0 nit); no duplicates or previous iterations.
- Diff: `main...HEAD`, base `dd99ed2cf39c805d719f943c5d7061a5683d98a8`, head `eddbc1b`, branch `feat/GH-1/article-reading-time`.
- Profile: none configured; feature/build correctness and regression preservation emphasis. Testing strategy and code-review blueprint loaded.
- Remediation: Phase 7 appended to `../chg-GH-1-plan.md`; no source files modified, no commit.

## Findings

1. **Major / high confidence** — `src/app/shared/pipes/reading-time.pipe.ts:11`: global emphasis-character replacement splits literal words and code identifiers. Direct invocation with 199 words plus `snake_case`, inline-code `snake_case`, or `pre**fix**` returns 2 rather than 1 minute. Correct practical stripping and add independent boundary regressions.
2. **Minor / high confidence** — `src/app/shared/pipes/reading-time.pipe.spec.ts:90`: assertion-inclusive timing does not isolate computation, and the informational test name implies an unenforced threshold. Measure only the function; distinguish diagnostic unit output from focused representative-machine acceptance.
3. **Minor / high confidence** — `src/app/features/article/pages/article/article.component.spec.ts:64`, also `components/article-preview.component.spec.ts:51`: actual body rendering and preview no-fetch/update behavior are not asserted despite checked preservation tasks. Complete concrete preservation tests rather than relying on container/component presence.

## Acceptance and plan audit

- AC1: **FAIL** for ordinary literal/intraword tokens; existing threshold and common-syntax tests otherwise pass. Practical heuristic scope does not excuse introducing extra word boundaries in retained content.
- AC2: PASS for empty/whitespace/short bodies and exact labels.
- AC3 / DEC-1: PASS; shared component hides null/undefined and shows present empty/string bodies. Previews legitimately hide estimates with current list responses.
- AC4: PASS; real page tests separately verify both metadata locations.
- AC5: Required core tests exist and pass; regression/preservation gaps above remain.
- AC6: Reviewer unit rerun passes. E2E did not execute; residual gap explicitly accepted by user, not a finding and not an E2E pass.
- F-4: Optional-body type, page Markdown fallback and editor normalization are narrowly scoped. Complete-body editor values are preserved; no additional affected production consumers found.
- NFR-1: Focused reviewer run reports median 1.0279 ms, maximum 3.0943 ms, 100/100 under 5 ms; assertion-inclusive measurement needs correction. Prior 5.1604-ms loaded-suite outlier retained as noise, not a proven performance defect. There is no timing assertion, so the present harness cannot fail solely due to suite-load timing noise.
- NFR-2: Pure deterministic local function and pure pipe; no collaborators or shared mutable state.
- NFR-3: Production diff adds no networking; page spies and HTTP controller verification preserve request boundaries. Preview request assertion is missing as described above.
- Plan status: **MISMATCH / INCOMPLETE**. OPEN_TASKS: 5.2/5.3 review/fix cycle and 6.7 final reconciliation; Phase 7 now open. Partial CHECKED_BUT_MISSING evidence: 1.4 content preservation; 3.2 and 4.1–4.3 concrete preservation/request assertions. No extra finding for expected review-cycle tasks or accepted E2E dispositions; no distinct DONE_BUT_UNCHECKED implementation gap.

## Scope and verification

The five legacy service-spec changes remove only redundant Zone imports and per-file Angular environment initialization. `vitest.config.ts` already loads `src/test-setup.ts`, which initializes that same environment; retaining a second initialization conflicts with it. The articles service spec follows the same cleanup. No service production behavior or existing assertions were removed. This is justified full-suite remediation, not harmful scope creep. The testing-strategy addition is explicitly authorized by PM notes.

- `bunx vitest run`: **11 files / 228 tests passed**.
- Focused pipe spec: **30 tests passed**; timing distribution above.
- Prettier checks for changed feature source/new component and pipe specs: passed. No whole-repository writing formatter run because review is source-read-only.
- `git diff --check` flags intentional Markdown hard-break trailing spaces in the test-plan artifact; no finding.
- Build not rerun in this review; existing recorded successful build evidence inspected. E2E not rerun per accepted disposition.
- Pre-existing dirty `.gitignore`, PM notes, and untracked tool/blueprint files left untouched.

Version bump skip, TC-READTIME-012 N/A, and no-system-spec-update decisions are respected. Execute Phase 7 and rerun review; do not commit from this reviewer role.
