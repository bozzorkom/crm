# Lead Capture Workflow Implementation Plan

**Goal:** Make the home-page message composer create a real lead in the current CRM prototype and keep it available across in-app navigation.

**Architecture:** Add one client-side lead workspace provider seeded from the existing mock data. The composer will collect the client name, optional phone, and source, then add the lead and open its detail. Changes remain in memory for the current browser session only; no personal client data is written to browser storage while authentication, tenant isolation, and a backend are absent.

**Tech Stack:** Next.js 16.4.2, React 19, Tailwind CSS 4.3.3, existing TypeScript components and local mock data.

**Spec:** `../../../../product.md` sections 7.1–7.3, 8 (FR-02–FR-04), 10.1–10.4, 16, and 20.2.

## Global Constraints

- Keep the light interface, black primary, and existing v0/ChatGPT visual language.
- Keep the UI Russian-first and mobile-first.
- Extracted requirements are drafts and require user confirmation; do not imply a live AI integration.
- Do not persist personally identifying client data in `localStorage`.
- Keep Next.js on the latest stable 16.x patch and Tailwind CSS on stable 4.3.x.

## Review Focus

- Empty/whitespace-only client names must not create a lead; source and name are required in the form.
- Leads without a phone must remain readable and must not render broken `tel:` actions.
- New leads must appear in the sidebar, attention queue, and lead list after client-side navigation.
- Session-only behavior must be disclosed so the prototype does not imply durable CRM storage.
- If a session-only lead disappears after refresh, its old URL must show an unavailable state rather than another client's card.
- Cyrillic/Russian text and phone values with punctuation must not be corrupted.
- A room-count phrase such as `3 комнаты` must not be interpreted as a budget suffix.
- A budget phrase such as `до 3к` or `$3к` must not be interpreted as a room count; `3к квартира` remains a room shorthand.
- Do not promise that structured need fields can be edited later unless the UI supports that action.
- Mobile actions without an implemented channel/showing workflow must be visibly unavailable, not dead links.

### Task 1: Align framework patch version

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `next.config.mjs` (remove the setting that suppresses TypeScript build errors)

Set `next` to the latest stable 16.x patch available at implementation time (16.4.2); retain Tailwind CSS and its PostCSS adapter at 4.3.3.

### Task 2: Add shared lead workspace

**Files:**
- Create: `components/leads/lead-workspace.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `components/leads/leads-view.tsx`
- Modify: `components/leads/lead-detail.tsx`
- Modify: `components/shell/sidebar.tsx`
- Modify: `components/shell/mobile-nav.tsx`
- Modify: `components/calendar/calendar-view.tsx` (replace an unsupported `Button asChild` call with the existing button variants on the link)
- Create: `components/today/attention-list.tsx`
- Create: `components/today/today-greeting.tsx`
- Modify: `lib/data.ts`
- Modify: `lib/match.ts` (require a whole suffix token so `3 комнаты` cannot be interpreted as a `3k` budget)

Expose `useLeadWorkspace()` with `leads: Lead[]`, `addLead(input): Lead`, and `updateLead(next: Lead): void`. Keep the provider at the root client boundary and seed it from `lib/data.ts`. Make phone optional and hide phone-only actions when no phone exists.

### Task 3: Complete composer-to-lead flow

**Files:**
- Modify: `components/today/composer.tsx`

After the user reviews the extracted need, collect the client name, optional phone, and lead source; create the lead in the shared workspace; show an explicit session-only notice; then open the new lead detail. Rename AI-sounding copy to describe a draft/parser rather than a live AI service.

**Manual verification:** run the app and walk through composer → contact/source form → created lead → sidebar/attention/list → add note/next step → navigate to another route → return. Also refresh and confirm the session-only caveat is true. Do not add automated tests for this slice unless requested.
