---
change:
  ref: GH-1
  type: feat
  status: Proposed
  slug: article-reading-time
  title: 'Display estimated reading time on articles'
  owners: ['engineering']
  service: conduit-frontend-articles
  labels: [change]
  version_impact: minor
  audience: external
  security_impact: none
  risk_level: low
  dependencies:
    internal: [article-meta component, article preview, article page, Article model]
    external: [RealWorld API (read-only, unchanged)]
---

# CHANGE SPECIFICATION

> **PURPOSE**: Define the "estimated reading time" capability for articles in the Conduit client, so that planning, test planning and delivery can proceed from a single, unambiguous source.

## 1. SUMMARY

Readers currently get no indication of how long an article takes to read. This change shows an estimated reading time ("X min read") computed client-side from the article body, with no API change. The time is rendered inside the shared article meta block next to the date, and only when the article body is available (PM decision DEC-1).

## 2. CONTEXT

### 2.1 Current State Snapshot

- Angular 21 RealWorld (Conduit) app; standalone components, signals, OnPush.
- A shared article meta component shows author and date; it is used by article previews (home feed, tag feed, profile lists) and by the article page (banner and bottom actions).
- Single-article endpoint (`GET /api/articles/:slug`) returns `body`. List endpoints (`GET /api/articles`, `GET /api/articles/feed`) no longer return `body` since 2024-08-16 per the RealWorld API response format spec.
- The client Article model currently types `body` as required.
- No system specification exists under `.samourai/docai/spec`.

### 2.2 Pain Points / Gaps

- No reading-time information anywhere.
- Article model does not reflect that list responses omit `body`.

## 3. PROBLEM STATEMENT

Readers cannot judge the time commitment of an article before or while reading it.

## 4. GOALS

- G-1: Show "X min read" computed from the article body, client-side.
- G-2: Do not display misleading values where the body is unavailable.
- G-3: Keep existing behavior and tests intact.

### 4.1 Success Metrics / KPIs

- 100% of article pages show a reading time in both meta occurrences.
- 0 regressions in existing unit and E2E suites.
- Unit tests cover all cases listed in AC-F-3-1.

### 4.2 Non-Goals

- API/backend changes.
- i18n or pluralization variants.
- Fetching article bodies for previews.
- Configurable words-per-minute.

## 5. FUNCTIONAL CAPABILITIES

| ID  | Capability                                                                 | Rationale                                  |
| --- | -------------------------------------------------------------------------- | ------------------------------------------ |
| F-1 | Compute reading time in whole minutes from an article body                 | Core value; reusable, testable logic       |
| F-2 | Format and display reading time as "X min read" in the shared article meta | Single place covering page and previews    |
| F-3 | Conditional display: render only when body is present                      | Honest data given list endpoints omit body |
| F-4 | Article model reflects optional body                                       | Type accuracy with the API                 |

### 5.1 Capability Details

**F-1**: minutes = ceil(wordCount / 200). Word count is taken from the body with Markdown syntax excluded where practical: code fence markers, inline code backticks, link and image URLs (link text kept), heading markers, emphasis markers (`*`, `_`, `~`), blockquote markers, list markers, HTML tags, horizontal rules. Minimum result is 1 (empty, whitespace-only, very short bodies).

**F-2**: Output text is "X min read", displayed next to the date inside the article meta, as an additional element that does not alter existing meta markup.

**F-3**: Displayed iff `body` is neither null nor undefined. An empty string counts as present and yields "1 min read". When absent, no element and no placeholder is rendered.

**F-4**: `body` becomes optional on the Article model; any resulting type fallout (e.g. editor) is resolved without behavior change.

## 6. USER & SYSTEM FLOWS

1. Reader opens an article page → single-article response includes body → both meta blocks show "X min read".
2. Reader browses a feed/profile list → list response omits body → previews show no reading time.
3. If a backend returns body in lists → previews show "X min read" automatically.

## 7. SCOPE & BOUNDARIES

### 7.1 In Scope

- Reading-time computation, formatting, and display in shared meta.
- Optional `body` on Article model and resulting type adjustments.
- Unit tests; confirming existing E2E suite stays green.

### 7.2 Out of Scope

- [OUT] API/backend changes.
- [OUT] i18n/pluralization.
- [OUT] Fetching bodies for previews.
- [OUT] Configurable words-per-minute.

### 7.3 Deferred / Maybe-Later

- Reading time in previews with the current API (would need backend support or extra requests).
- Locale-aware formatting.

## 8. INTERFACES & INTEGRATION CONTRACTS

### 8.1 REST / HTTP Endpoints

No new or changed endpoints. Consumes existing `GET /api/articles/:slug` (body present) and list endpoints (body absent).

### 8.2 Events / Messages

None.

### 8.3 Data Model Impact

- DM-1: Client Article `body` changes from required to optional. No persisted data impact.

### 8.4 External Integrations

None.

### 8.5 Backward Compatibility

Fully backward compatible; existing markup (`.article-meta`, `.date`) is preserved and the reading time is added as a sibling element inside the info block.

## 9. NON-FUNCTIONAL REQUIREMENTS (NFRs)

- NFR-1: Reading-time computation completes in < 5 ms for a 10,000-word body on a typical developer machine.
- NFR-2: Computation is pure and deterministic (same input → same output; no side effects).
- NFR-3: No additional network requests are introduced (0 added).

## 10. TELEMETRY & OBSERVABILITY REQUIREMENTS

None required.

## 11. RISKS & MITIGATIONS

| ID    | Risk                                                       | Impact | Probability | Mitigation                                                    | Residual |
| ----- | ---------------------------------------------------------- | ------ | ----------- | ------------------------------------------------------------- | -------- |
| RSK-1 | Markdown stripping heuristics are imprecise                | L      | M           | Scope is "where practical"; test common syntax                | Low      |
| RSK-2 | E2E selectors on `.article-meta` / `.date` break           | M      | L           | Keep existing markup; add sibling element only; run E2E suite | Low      |
| RSK-3 | Optional `body` causes type errors elsewhere (e.g. editor) | L      | M           | Fix type fallout; verify with build and tests                 | Low      |
| RSK-4 | Users expect reading time in previews and see none         | L      | M           | Documented in DEC-1; deferred item in 7.3                     | Medium   |

Edge cases: empty/whitespace-only body; body with only Markdown syntax or URLs; very long body; body with code blocks, images, HTML; body null vs undefined vs empty string.

## 12. ASSUMPTIONS

- Reading speed is fixed at 200 words per minute.
- Words are whitespace-separated tokens after Markdown stripping.

## 13. DEPENDENCIES

- Internal: shared article meta component, article preview, article page, Article model.
- External: RealWorld API behavior as described above (unchanged).
- Tooling: Vitest unit tests, Playwright E2E tests (specs in realworld submodule and local e2e).

## 14. OPEN QUESTIONS

None. (Preview behavior was resolved by DEC-1.)

## 15. DECISION LOG

- DEC-1 (PM decision "option D", logged on ticket): Reading time is rendered in the shared article meta only when `article.body` is not null/undefined. Article page always shows it; previews hide it with the current API, and show it if a backend returns body. Rationale: honest data, no N+1 requests, single condition, reversible.
- DEC-2: Placement is next to the date inside the shared meta, covering both banner and bottom actions.
- DEC-3: `Article.body` becomes optional.
- DEC-4: Logic is a pure reusable function plus a pure formatting pipe.

## 16. AFFECTED COMPONENTS (HIGH-LEVEL)

- Shared article meta component
- Article preview component
- Article page
- Article model
- Shared pipes/utilities (new)

## 17. ACCEPTANCE CRITERIA

- **AC-F-1-1** (AC1): Given a body with N words, when reading time is computed, then the result is ceil(N / 200), with Markdown syntax (code fences, inline backticks, link/image URLs with link text kept, heading `#`, emphasis `*_~`, blockquote `>`, list markers, HTML tags, horizontal rules) excluded where practical. (F-1)
- **AC-F-1-2** (AC2): Given an empty, whitespace-only, or very short body, when reading time is displayed, then it reads "1 min read". (F-1, F-2)
- **AC-F-3-1** (AC3): Given an article preview, when the article has a body, then "X min read" is displayed; when the body is null/undefined, then no element and no placeholder is rendered (current API case). (F-3)
- **AC-F-2-1** (AC4): Given the article page, when the article is loaded, then "X min read" is displayed in both meta occurrences (banner and bottom actions). (F-2, F-3)
- **AC-F-1-3** (AC5): Given the unit test suite, when run, then tests cover empty body, short body, long body, Markdown content, pipe formatting, and meta component show/hide. (F-1, F-2, F-3)
- **AC-NFR-1-1** (AC6): Given the change is applied, when existing unit and E2E suites run, then all remain green. (NFR-3, F-4)

## 18. ROLLOUT & CHANGE MANAGEMENT (HIGH-LEVEL)

Ship as a normal client release; no flags, no migration. Reversible by removing the display element.

## 19. DATA MIGRATION / SEEDING (IF APPLICABLE)

Not applicable.

## 20. PRIVACY / COMPLIANCE REVIEW

No personal data processed or stored; computation is local.

## 21. SECURITY REVIEW HIGHLIGHTS

Output is plain text derived from a number; article body is never rendered by this feature. No security impact.

## 22. MAINTENANCE & OPERATIONS IMPACT

Negligible. Constant (200 WPM) is easily adjustable later.

## 23. GLOSSARY

- **WPM**: words per minute.
- **Preview**: article summary card in feeds and profile lists.
- **Meta**: author/date block shared by previews and article page.

## 24. APPENDICES

- Ticket: https://github.com/opensourceMS/angular-realworld-example-app/issues/1
- API reference: RealWorld API response format spec (list endpoints omit `body` since 2024-08-16).

## 25. DOCUMENT HISTORY

| Date       | Version | Change                  |
| ---------- | ------- | ----------------------- |
| 2026-10-06 | 0.1     | Initial spec (Proposed) |

---

## AUTHORING GUIDELINES

Authored from the planning summary, PM notes (decisions), and the RealWorld API docs. No system spec exists. Definition of Done: all AC-F/NFR criteria (AC1–AC6) satisfied; unit tests added and passing; existing unit and E2E suites green; formatting check passes; no unresolved type errors from the optional `body`.

## VALIDATION CHECKLIST

- [x] `change.ref` matches provided `workItemRef`
- [x] `owners` has at least one entry
- [x] `status` is "Proposed"
- [x] All sections present in order (1-25 + guidelines + checklist)
- [x] ID prefixes consistent and unique
- [x] Acceptance criteria reference at least one F-/NFR- ID and use Given/When/Then
- [x] NFRs include measurable values
- [x] Risks include Impact & Probability
- [x] No implementation details
- [x] Front matter validates per front_matter_rules
