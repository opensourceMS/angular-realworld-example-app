# GH-1 — Review iteration 2

- Date: 2026-10-06
- Status: **PASS**
- Findings: **0** (0 critical / 0 major / 0 minor / 0 nit).
- Branch: `feat/GH-1/article-reading-time`; base `main` (`dd99ed2`); reviewed head `729a675`.
- Remediation inspected: `eb2f9a7` (source/tests), `729a675` (documentation); cumulative `main...HEAD` scope also checked.
- Profile: none configured; feature correctness and regression preservation, with repository testing strategy and review checklist.

## Previous findings

1. **Resolved — word splitting:** Replacing emphasis-like characters with the empty string preserves the whitespace-token count of literal identifiers, code identifiers, and intraword emphasis. Three independently constructed regression pairs verify 200 words yield one minute and an appended word yields two. Existing Markdown-boundary and long-body assertions pass. A full Markdown parser is unnecessary for the practical counting contract.
2. **Resolved — timing accuracy:** The timer now ends before the Vitest assertion. Test name and output explicitly label the results diagnostic, not an enforced NFR gate. Reviewer focused run: 100/100 calls below 5 ms, median 0.5625 ms, maximum 2.6541 ms; Node v22.17.1, Linux/x64, Intel Core i7-1365U in a virtualized environment. Earlier passing measurements and the 5.1604-ms loaded-suite outlier remain visible. No mandatory flaky timing assertion introduced; no claim of a universally idle machine.
3. **Resolved — preservation evidence:** Page tests now assert actual asynchronously rendered content and safe absent-body output, plus exact dates, author links, avatars, and projected favorites at both metadata locations. Preview tests use controlled dependencies and verify zero detail fetches across input changes and repeated detection. Existing editor/service compatibility coverage remains green.

## Regression and acceptance audit

AC1–AC5 have implementation and passing automated evidence. AC6 unit coverage passes; the E2E portion remains an explicitly user-accepted residual gap, not an E2E pass. Optional-body model and page/editor fallbacks remain narrow. Pure calculation/pipe behavior, conditional null/undefined visibility, both page locations, and unchanged networking remain intact. The existing shared TestBed initialization justifies the legacy-spec cleanup. No new regression, out-of-scope production change, API change, debug-interface edit, or submodule-pointer change found.

The heuristic still does not promise exhaustive Markdown parsing. This limitation is consistent with AC1's practical scope; the previously reproduced ordinary-word counting defect is fixed.

## Verification

- Reviewer: `bunx vitest run` — **11 files / 231 tests passed**.
- Reviewer: focused pipe run with diagnostic output — **33 tests passed**, corrected calculation-only timing above.
- Reviewer: Prettier check for remediation source/spec files — **passed**. No writing formatter run on source.
- Coder-reported: `bun run build`, repository-wide formatting — **passed**; not independently rerun.
- E2E not rerun. Version bump skip, TC-READTIME-012 N/A, and no-system-spec-update decisions respected.

## Closeout

Phase 7 and review/fix tasks 5.2/5.3 closed in the plan, with commit references and independent verification. Plan status: **ALL_TASKS_DONE**; no remaining plan or test-coverage gaps beyond accepted E2E/manual limitations. No new remediation tasks required. Iteration-1 artifacts retained unchanged.

Next step: **PROCEED** to PM quality/DoD and human review. No source modifications or commit. Pre-existing `.gitignore` and untracked workspace files left untouched.
