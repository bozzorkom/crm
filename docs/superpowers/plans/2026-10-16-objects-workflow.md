# Objects Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a session-only, end-to-end Objects prototype with separate physical-property and listing records, safe freshness/matching rules, import preview, and linked activity.

**Architecture:** Keep fixture and mutable object state in a client-side React provider mounted at the app root. Model `Property` and `Listing` separately, with pure domain helpers for status transitions, filtering, duplicate candidates, import normalization, and matching. Add object list/create/detail/edit/import routes while retaining compatibility resolvers for the existing demo Deals and Calendar screens.

**Tech Stack:** Next.js 16.4.2 App Router, React 19, TypeScript, Tailwind CSS 4.3.x, pnpm, Vitest for pure domain tests, SheetJS Community Edition 0.20.3 for local XLSX parsing.

**Spec:** `docs/superpowers/specs/2026-10-16-objects-workflow-design.md`

## Global Constraints

- Treat this as a UI prototype only: no backend, authentication, network upload, portal/API integrations, or legal verification.
- Keep mutable data in the app-root React provider; it survives client-side route navigation and resets on full reload.
- Do not write contact/address data to `localStorage` or `sessionStorage`; do not add real personal contact data to fixtures.
- Only `active` listings with explicit client-share permission may enter client matching.
- Verification/status changes must be explicit events with the fixed `currentUser` as actor; cancellation must not mutate state.
- Similarity detection proposes decisions only; never auto-merge physical properties or listings.
- Do not claim an external message was sent, a portal was synced, or ownership/legal rights were verified.
- Read `AGENTS.md` and the relevant installed Next.js 16 guide under `node_modules/next/dist/docs/` before changing routes or app layout.
- `crm/` is not a Git repository; do not create branches, worktrees, or commits.

## Review Focus

1. **A property with a new offer vs duplicate offer:** test that an existing physical-property match can receive a distinct listing, while a likely exact listing duplicate requires an explicit choice.
2. **Noisy/malformed spreadsheet input:** test BOM, quoted delimiters/newlines, empty rows, invalid prices/currencies, and unreadable workbooks; errors must be reported without mutating catalogue state.
3. **Currency and rent units:** test USD/UZS and monthly rent formatting/filtering without comparing unlike currencies as if equivalent.
4. **Status/permission edge cases:** test stale, reserved, unavailable, closed, archived, and client-share-disabled listings never appear as exact client matches.
5. **Session-only direct routes:** manually test that an entry survives in-app navigation but a created-entry URL after reload displays a clear expired-demo explanation, not a broken detail page.

---

### Task 1: Establish domain types, fixture mapping, and test harness

**Files:**
- Create: `lib/objects/types.ts`
- Create: `lib/objects/domain.ts`
- Create: `lib/objects/fixtures.ts`
- Create: `tests/objects/domain.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json`, `pnpm-lock.yaml`, `lib/data.ts`

**Interfaces:**
- `Property`: stable physical-property data (`id`, kind, title, location, physical attributes, image references).
- `Listing`: offer data (`id`, `propertyId`, `deal`, `price`, `currency`, `priceUnit`, `status`, `agent`, `source`, `visibility`, `clientShareAllowed`, verification metadata, price history, event history).
- `ListingView`: `{ listing: Listing; property: Property }` projection consumed by cards/details.
- `ListingStatus`: `draft | review | active | needs_review | temporarily_unavailable | reserved | closed | withdrawn | archived`.
- `findListingDuplicates(candidate, catalog)` returns typed candidate signals distinguishing same physical property from likely same listing; it never changes input.
- `canActivateListing(listing, property)` and `getClientEligibleListings(catalog)` encode the approved activation/matching rules.
- Legacy seed IDs `p1`–`p8` remain resolvable for existing Deal/Calendar references; each is mapped to one physical record and one listing without changing visible sample content.

- [ ] **Step 1: Add Vitest and write failing domain tests** for separate Property/Listing identity, duplicate classifications, activation prerequisites, and exclusion of non-client-ready statuses.
- [ ] **Step 2: Verify RED** with `pnpm test -- --run tests/objects/domain.test.ts`; expected failures are missing domain exports/behavior, not configuration errors.
- [ ] **Step 3: Implement the model and pure helpers** in the three `lib/objects/` files; migrate the existing eight fixtures to Property + Listing pairs and add a listing-view resolver that preserves legacy IDs.
- [ ] **Step 4: Verify GREEN** with `pnpm test -- --run tests/objects/domain.test.ts` and `pnpm build`; expected: all domain cases pass and existing routes still type-check.

### Task 2: Add app-wide session state and compatibility resolvers

**Files:**
- Create: `components/objects/object-workspace.tsx`
- Create: `tests/objects/workspace.test.ts`
- Modify: `app/layout.tsx`, `lib/data.ts`, `app/deals/page.tsx`, `components/calendar/calendar-view.tsx`, `components/today/today-sections.tsx`, `components/kalit/property-card.tsx`

**Interfaces:**
- `ObjectWorkspaceProvider` owns `{ properties, listings }` and demo events for the lifetime of the mounted app.
- `useObjectWorkspace()` exposes `addPropertyWithListing(input)`, `addListingForProperty(propertyId, input)`, `updateListing(id, patch)`, `recordVerification(id, input)`, `archiveListing(id)`, `applyImportBatch(batch)`, and `undoImportBatch(batchId)`.
- `recordVerification` requires a result and method, stamps current time/currentUser, appends price history when price changes, and transitions status only according to the design spec.
- `getListingView(listingId)` returns a joined view or `null`; a legacy resolver maps existing `propertyId` fixture references to the original listing IDs.

- [ ] **Step 1: Write failing tests** for event author/time, price-history append, rejected verification cancellation, and draft/needs-review transition rules.
- [ ] **Step 2: Verify RED** with `pnpm test -- --run tests/objects/workspace.test.ts`.
- [ ] **Step 3: Implement the provider and mount it beside `LeadWorkspaceProvider`** in `app/layout.tsx`; preserve existing Deals/Calendar fixture behavior through the resolver.
- [ ] **Step 4: Verify GREEN** with the focused workspace tests and `pnpm build`.

### Task 3: Build catalogue, create/edit, detail, and verification flows

**Files:**
- Modify: `app/objects/page.tsx`, `components/objects/objects-view.tsx`, `components/kalit/property-card.tsx`, `components/kalit/badges.tsx`
- Create: `app/objects/new/page.tsx`, `app/objects/[listingId]/page.tsx`, `app/objects/[listingId]/edit/page.tsx`
- Create: `components/objects/listing-form.tsx`, `components/objects/verification-form.tsx`, `lib/objects/filters.ts`, `tests/objects/filters.test.ts`

**Interfaces:**
- `filterListingViews(views, filters)` combines query, kind, deal, status, rooms, district, agent, currency/price range, freshness, and sort.
- `ListingForm` supports new physical property + first listing, existing property + new listing, draft save, and edit without replacing prior listings.
- Activation uses Task 1 validation; `ListingForm` must show missing fields and retain draft state instead of silently failing.
- `VerificationForm` submits the result/method/new price/comment only after confirmation; Escape/cancel/back does not invoke the provider mutation.
- The detail page shows property facts separately from offer terms, provenance/access flags, price/status/check history, linked demo selections/showings, and the expired-session state for unknown IDs.

- [ ] **Step 1: Write failing filter tests** for combined search/filter/sort, currency-safe price comparisons, status tabs, and empty results.
- [ ] **Step 2: Verify RED** with `pnpm test -- --run tests/objects/filters.test.ts`.
- [ ] **Step 3: Implement filters and catalogue routes**; make Add, View, Edit, Check, Archive, Clear filters, and secondary-listing actions real and keyboard accessible.
- [ ] **Step 4: Verify GREEN** with the focused test and `pnpm build`.
- [ ] **Step 5: Browser-check** add draft → navigate away/back → open detail/edit → change offer → verify availability/price → confirm history and filtering; check mobile width and stale created-entry URL after refresh.

### Task 4: Implement local CSV/XLSX import with dry-run and duplicate decisions

**Files:**
- Create: `app/objects/import/page.tsx`
- Create: `components/objects/import-wizard.tsx`
- Create: `lib/objects/import.ts`
- Create: `tests/objects/import.test.ts`
- Modify: `package.json`, `pnpm-lock.yaml`, `components/objects/objects-view.tsx`

**Interfaces:**
- `parseCsv(text)` supports UTF-8/BOM, comma or semicolon delimiters, escaped quotes, and quoted newlines.
- `parseSpreadsheet(file)` reads CSV or the first XLSX worksheet locally via `await file.arrayBuffer()` and SheetJS `read`; it performs no fetch/upload.
- `previewImport(rows, catalog)` returns normalized rows with `ready | error | duplicate` disposition, field errors, and explicit same-property/same-listing candidate actions.
- `applyImportBatch(batch)` adds only explicitly confirmed rows as drafts; `undoImportBatch(batchId)` removes only that batch from the current session after confirmation.

- [ ] **Step 1: Add SheetJS CE 0.20.3 from its official distribution and write failing parser/preview tests** for CSV quoting/BOM, a generated XLSX workbook, malformed values, same-property/new-listing, and exact-listing duplicate.
- [ ] **Step 2: Verify RED** with `pnpm test -- --run tests/objects/import.test.ts`.
- [ ] **Step 3: Implement parser, mapping/preview, row decisions, apply/undo, and import UI**; show file-local processing and synthetic-data warning before selection.
- [ ] **Step 4: Verify GREEN** with focused import tests and `pnpm build`.
- [ ] **Step 5: Browser-check** CSV and XLSX preview, row errors, duplicate choices, cancel-without-mutation, confirm-import, undo-import, and route navigation.

### Task 5: Connect matching, lead reactions, and end-to-end prototype verification

**Files:**
- Modify: `lib/match.ts`, `components/match/match-view.tsx`, `components/today/composer.tsx`, `components/leads/lead-detail.tsx`, `components/leads/lead-workspace.tsx`, `app/objects/[listingId]/page.tsx`
- Create: `lib/objects/activity.ts`, `tests/objects/matching.test.ts`

**Interfaces:**
- `matchListings(need, listingViews)` ranks only active, fresh, client-share-enabled listings; reserved/unavailable/review/closed/withdrawn/archived/not-cleared rows are excluded from exact results and carry explicit reasons if shown separately.
- Existing deterministic match reasons remain visible; score never overrides hard status/permission exclusions.
- With a `leadId` in the URL, selection is attached to that lead; otherwise the UI requires choosing a demo lead before generating a selection record.
- `recordSelectionActivity` appends events to the selected lead and listings. `recordClientReaction` records result/reason in both timelines. UI copy says “Подборка подготовлена” and never claims Telegram/email delivery.
- Existing Calendar showings are joined by listing ID and remain readable; scheduling stays in the Calendar module.

- [ ] **Step 1: Write failing matching/activity tests** for each excluded status, disabled client sharing, a stale active listing, lead-linked selection, and “prepared, not sent” semantics.
- [ ] **Step 2: Verify RED** with `pnpm test -- --run tests/objects/matching.test.ts`.
- [ ] **Step 3: Implement match filtering and local activity linkage**; update Today, Match, Leads, Calendar, and Deals consumers to use the compatibility resolver without regressing current flows.
- [ ] **Step 4: Verify GREEN** with focused and full unit tests, then run `pnpm build`.
- [ ] **Step 5: Run full browser acceptance** across Objects → Match → Lead → object history, plus all legacy CRM routes, refresh/reset disclosure, keyboard path, and mobile viewport.

## Verification Commands

- Focused: `pnpm test -- --run tests/objects/<task>.test.ts`
- Full tests: `pnpm test -- --run`
- Production type/build check: `pnpm build`
- Manual UI: use the running local app at `http://localhost:3000/` and test with synthetic data only.

## Implementation References

- [SheetJS: reading local browser files](https://docs.sheetjs.com/docs/demos/local/file/) — use `File.arrayBuffer()` and parse the bytes in-browser.
- [SheetJS CE installation](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/) — pin the official 0.20.3 distribution rather than an outdated npm mirror.
- [Vitest getting started](https://vitest.dev/guide/index.html) — add a small TypeScript unit-test harness for pure domain/import logic.

