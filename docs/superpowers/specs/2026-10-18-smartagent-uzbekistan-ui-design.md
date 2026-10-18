# SmartAgent Uzbekistan UI Design Specification

**Status:** Draft for product-owner review
**Date:** 18 October 2026
**Purpose:** Design brief for completing the interactive UI prototype before developer handoff. This is not a production implementation specification.

## 1. Product intent

Design an interactive, responsive prototype for the Uzbekistan real-estate agency pilot that makes the product's value legible in a real working day: an enquiry is captured, the agent understands the client's need, finds a sufficiently current property, follows through on a viewing, and the agency can see what happened next. The product should reduce lost opportunities and administrative friction, not add another form-heavy CRM.

The intended commercial effect is that an agency can quickly understand and experience the value. The design must not imply that a UI prototype, AI feature, or integration has already produced a measurable increase in revenue.

“A product that sells itself” is a requirement to make value easy to experience and explain, not a promise of viral growth. The UI should shorten time to first value, let an agency see a real workflow outcome, and show evidence from its own data. Referrals, public claims, and ROI figures remain hypotheses until validated.

### Agreed constraints

- Pilot market: Uzbekistan; start with Tashkent as a working hypothesis, not an established market fact.
- Product type: interactive UI prototype for review and eventual developer handoff; no production backend or real integrations are part of this design task.
- Primary actors: agency owner/manager and real-estate agent. Operations assistant and limited-access partner are supporting roles. A client appears in a preview/selection flow, not as a full consumer portal in the pilot.
- Product frame: agency workflow from incoming lead to next action, viewing, and deal visibility. Do not merge separate landlord, buyer marketplace, property valuation, construction, or Dubai concepts into the CRM navigation.
- Platform: responsive web prototype; prioritize quick capture and daily agent actions on a phone, with team oversight and analysis comfortable on desktop. Native iOS/Android and a Telegram Mini App are not assumed.
- Locale: Russian and Uzbek are product requirements. Currency must be explicit (UZS and, where relevant, USD); never silently convert. Confirm language script and local terms during pilot validation.
- AI: suggestions are editable drafts with a clear source/context and user confirmation. Do not invent facts about a client or property, auto-send messages, or claim autonomous communication.
- Local fixtures and simulated integrations are acceptable in the prototype when visibly represented as demo behavior. Actual permissions, delivery, imports, persistence, and external API access belong to the engineering handoff and must not be implied as already connected.

## 2. Evidence and source hierarchy

1. `crm/docs/product.md` (PRD v2, dated 15 October 2026) is the current product source of truth for the pilot's strategic frame, MVP boundary, personas, user flows, import, role, data-quality, and trust requirements.
2. The existing prototype and `crm/docs/implementation-gap-audit.md` describe current UI coverage and gaps. The audit is an existing untracked, user-owned file; this specification does not modify or replace it.
3. The supplied `docs/Product/*.md` and `docs/_unsort/*.md` corpus is a source of product hypotheses, pain inventories, concept branches, and design ideas. It is not one consistent approved backlog. Some documents target different buyers, geographies, or products and contain scores, market claims, legal statements, and technical assumptions that require independent validation.

Where sources disagree, preserve the reference and classify the item as one of: **pilot core**, **later agency capability**, **separate product direction**, or **needs validation**. Do not sum scores from different documents or present them as measured market evidence. The two enumerated pain catalogs in `_unsort/5.md` (47 entries) and `_unsort/12.md` (46 entries) overlap but are not interchangeable; their IDs must remain source-qualified in the eventual traceability appendix.

## 3. Product boundary and success

### In scope for the prototype

- Show an end-to-end value loop, not a collection of disconnected dashboard screens.
- Make records and transitions understandable: lead, client, one or more client requests, property, match, selection shared, viewing, follow-up/task, deal, and commission are linked but not collapsed into one ambiguous record.
- Include an agency-level view of unresolved work and a personal agent-level action queue.
- Demonstrate migration/activation, core team controls, and the deferred directions clearly enough to communicate how they fit without letting them displace the core loop.
- Design a self-guided path from preview/demo to first useful outcome and evidence of value; include trial/plan decisions only to the depth supported by the pilot sales model.
- Make critical success, empty, warning, error, cancel, permission, and no-match states visible in the prototype plan.
- Include weak-network/offline and privacy/data-portability states where they affect trust or the ability to continue work.

### Out of scope for this design phase

- Backend, database schema implementation, production authentication, actual role enforcement, API delivery, notification jobs, or audit infrastructure.
- Real Telegram, WhatsApp, Instagram, OLX, telephony, government, bank, payment, or calendar integrations.
- Autonomous AI replies, voice calling, call recording/transcription guarantees, scraping restricted sources, legal verification, property-price guarantees, accounting, or payment processing.
- A public classified marketplace, full MLS/network between agencies, landlord/property-management product, consumer mortgage product, construction trust platform, or UAE/Dubai product.

### Prototype success criteria

An agency owner and agent can complete or understand the key journeys without narration; users can tell what is real, simulated, or unverified; every agreed in-scope pain has a traceable screen/scenario or an explicit deferral; and a developer can identify the screens, states, interactions, dependencies, and unresolved validation gates from the handoff plan.

## 4. Roles and primary jobs

| Role | Job in the pilot | Design emphasis |
|---|---|---|
| Owner | Protect agency data, understand missed work and outcomes, approve team rules and commissions | Pulse, drill-down to source records, access and ownership clarity |
| Manager / team lead | Keep leads assigned and moving; coach and unblock agents | SLA/next-action queue, team workload, exception-first analytics |
| Agent | Capture a request quickly, find a suitable current property, arrange a viewing, remember follow-up | Mobile-first quick actions, minimal typing, linked context and one clear next step |
| Operations assistant | Maintain records, imports, listings, and process hygiene | Bulk work with preview, reversible actions, explicit validation/errors |
| Partner agent / agency | Coordinate only the agreed shared transaction | Limited disclosure, agreement summary, confirmation and audit context |
| Client (preview recipient) | Review a curated set of relevant property options | Clean share preview; never expose internal notes, owner contact, commission, or team-only fields |

## 5. Information architecture

Use one coherent agency workspace. Do not create duplicate navigation destinations for concepts that can be made clear by role and view.

| Navigation area | Primary purpose | Key distinction |
|---|---|---|
| Today | Agent's personal work queue: urgent/new leads, due tasks, today's viewings, records without a next step | Personal and action-oriented; not an analytics dashboard |
| Leads / Inbox | New and active enquiries, source, response state, assignment, and linked client history | In the pilot, the lead list is the operational inbox. A separate multi-channel conversation inbox is not implied until real channel scope is validated |
| Match | Search and compare current properties against a selected client request | Explain exact vs near match, freshness, missing facts, and exclusions |
| Calendar / Viewings | Schedule, prepare for, and record the result of a viewing | A viewing is linked to client, request, property, and responsible agent |
| Objects | Agency inventory, property detail, source, status, and freshness | Distinguish a property record from an external advertisement and from its availability status |
| Deals | Deal pipeline and detailed next actions, participants, documents, and commission state | A stage is not proof of a completed/paid transaction |
| Team | People, assignment, workload, permissions summary, and approved commission work | Only show controls that have a corresponding designed flow |
| Pulse / Analytics | Owner's exceptions and outcome-oriented performance | Pulse is actionable current risk; Analytics is historical, filterable, and drillable |
| Settings | Agency profile, roles, routing, language, notifications, and integration placeholders | Required setup can be skipped in demo mode; unconnected services are clearly labeled |

Global search is available from the shell only when it leads to results for in-scope records. If result groups/empty states are not designed, omit or visibly disable the affordance.

## 6. Core product loop

`Incoming enquiry → triage/owner → client request → property match → reviewed selection → viewing → outcome/follow-up → deal/pipeline visibility`

1. **Capture:** create a lead manually or from text, a short agent-recorded voice note, or an optional screenshot/photo in a demo source. Preserve source and arrival context. Any extraction is an editable draft with visible uncertainty; the agent confirms before saving. Do not imply automatic call recording or guaranteed RU/UZ recognition.
2. **Triage:** show response status, owner, time context/SLA state, and a useful action. Assignment and response remain human-controlled in the prototype.
3. **Understand the need:** link a lead to a client and one or more requests. Capture text, a short agent-recorded voice note, or an optional screenshot/photo; show extraction as an editable draft with source and uncertainty and keep a manual fallback. Edit budget/currency, purpose, property type, area, rooms, timeline, constraints, and unknowns without silently filling gaps.
4. **Match:** require hard constraints to remain visible; show exact and near matches separately; explain why each property appears, what does not match, and when availability/price was last checked.
5. **Prepare a client-facing selection:** review exactly which fields the client will see, remove properties, and simulate confirmed sharing. Record the sent selection in the lead/request history. Never expose internal-only data.
6. **Arrange a viewing:** choose client/request, property, time, and agent; show conflict, confirmation, move, and cancel paths. The demo must not imply that a message or calendar event was delivered externally.
7. **Close the loop:** record attended/rescheduled/no-show/cancelled, client response and an optional reason; offer a clear next action (follow-up, alternatives, negotiations, or close/loss). Update pipeline only with an explicit user action.
8. **Prove operational value:** Today helps the agent act; Pulse helps the manager find current leakage; Analytics explains trends and provides a path to underlying records. Metrics use explicit definitions and demo data labels.

## 7. Pain-to-solution design map

This is a normalized design map, not a claim that all source scores or problem statements are validated. Source pain IDs are kept qualified because the catalogs overlap and use different populations and phase definitions. The detailed implementation plan will include a row-level crosswalk for every listed source entry, with each row mapped to a UI solution, an explicit deferral, or a validation gate.

| Design ID | Recurring pain cluster | UI response to design | Priority | Source anchors |
|---|---|---|---|---|
| UZ-01 | Enquiries scattered across channels; delayed first response; missed calls; unclear ownership | Lead/Inbox queue with source, received time, response state, owner, SLA cue, manual capture and next action | P0 | `product.md` §5, §7, §10; `_unsort/5.md` #3/#5/#6/#28; `_unsort/12.md` #5/#16 |
| UZ-02 | Client facts and agreements are lost in chats or memory; voice notes are hard to search; duplicate/repeated questioning | Client profile with linked requests and searchable interaction/voice-note history; extracted facts retain source/time and remain editable; duplicates require review | P0 | `product.md` §5, §7, §10; `_unsort/5.md` #7/#41; `_unsort/12.md` #16/#20 |
| UZ-03 | Unqualified or misrouted enquiries consume agent time | Short qualification flow, missing-information prompts, human-controlled assignment and transparent priority reasons | P0/P1 | `product.md` §7, §10, §13; `_unsort/5.md` #4/#28; lead-source concept docs |
| UZ-04 | Warm leads, promises, renewals, and post-viewing follow-ups are forgotten | Today task queue, due/overdue states, follow-up composer as draft, completion/snooze and reactivation list | P0 | `product.md` §7, §10, §30; `_unsort/5.md` #21/#22/#42 |
| UZ-05 | Adding or finding a property is manual; forwarded posts disappear; listing information is chaotic across Telegram sources | Quick add, structured object form, source provenance, import/forwarded-content review and clear save outcome | P0/P1 | `product.md` §7, §11, §29; `_unsort/5.md` #10/#11; `_unsort/12.md` #6; `LivePropertyDatabase.md` |
| UZ-06 | Duplicated, stale, sold/rented, fake, or price-changed objects damage trust | Property status, last-checked timestamp, source and responsible party, duplicate/verification review, stale warning and safe deactivation | P0 | `product.md` §5, §7, §11, §28; `_unsort/5.md` #12/#13/#14/#39; `_unsort/12.md` #15/#38/#40 |
| UZ-07 | District/landmark naming varies; matching is slow, opaque, or repeats rejected options | Search aliases, hard vs soft constraints, exact/near results, reason chips, mismatch and freshness explanations, past selection status | P0 | `product.md` §7, §11, §30, §42; `_unsort/5.md` #9/#15/#16; `HumanInTheLoop.md` |
| UZ-08 | Selections are hard to present; agent cannot see what client received | Client preview, removable options, privacy-safe fields, simulated share confirmation and selection history | P0 | `product.md` §7, §30, §42; `MVP.md`; `HumanInTheLoop.md`; `implementation-gap-audit.md` |
| UZ-09 | Viewing coordination takes effort; conflicts/no-shows and outcomes are not captured | Create/reschedule/cancel flow, conflict state, reminder preview, outcome and next-step branch | P0 | `product.md` §7, §30; `_unsort/5.md` #19/#20; `LeadPilotConcept.md` |
| UZ-10 | Deal stages, negotiation terms, and loss reasons are unclear or live outside the system | Deal detail, configurable stage summary, required/optional transition fields, history and loss reason | P0/P1 | `product.md` §7, §12, §30; `_unsort/5.md` #23/#34; `implementation-gap-audit.md` |
| UZ-11 | Owner cannot see real outcomes; deals/base may leave with agent; team onboarding and manual KPI/motivation take too long | Distinct agent Today and owner Pulse, drill-down, role-aware record states, team setup, reversible handover and transparent performance definitions | P0/P1 | `product.md` §5, §7, §13, §20; `_unsort/5.md` #24/#25/#26/#27/#38/#44; `_unsort/12.md` #3/#4/#7/#25 |
| UZ-12 | Commission splits, partner promises, and actual payments are disputed or opaque | Deal-linked expected vs approved vs received commission, partner agreement summary, revision reason and confirmation history | P1 | `product.md` §5, §7, §14, §30; `_unsort/5.md` #36; `_unsort/12.md` #9/#10/#12/#26 |
| UZ-13 | Owner acquisition/exclusivity, direct-source discovery, unwanted intermediary calls, and owner communication are difficult | Owner/listing workspace, contact-sharing limits and evidence of work/updates as later agency capabilities; market radar only after source/legal validation | P1/P2 | `product.md` §7, §11, §28; `_unsort/5.md` #2/#17/#18; `_unsort/12.md` #1/#17/#29/#41; `DealRadarConcept.md`; `LivePropertyDatabase.md` |
| UZ-14 | Manual posting/reposting, multilingual content, ad limits, and campaign ROI are burdensome | Draft listing copy and explicit copy/export/share steps; source/campaign attribution and ROI only when inputs are defined | P1/P2 | `product.md` §11, §15, §22; `_unsort/5.md` #1/#30/#32/#33/#40; `_unsort/12.md` #11/#22/#24; `FunctionalMap.md` |
| UZ-15 | Calls are not logged; coaching and agreement capture are weak | Call/interaction history and consent-aware manual note entry first; recording/transcription and QA as gated later concepts | P1/P2 | `product.md` §9, §10, §13; `_unsort/5.md` #8/#29; `_unsort/12.md` #20; call/AI concepts |
| UZ-16 | Unclear legal process, service agreements, document coordination, client trust, fake listings, or property due diligence | Deal checklist, document status, source/verification label and consent context; never state that the app verifies legality or replaces a professional | P1/P2 | `product.md` §18, §30, §37; `_unsort/5.md` #35/#39; `_unsort/12.md` #8/#14/#19/#21/#23/#27/#31/#33/#34/#35/#38/#43–45 |
| UZ-17 | Cash flow, deposits, owner/renter operations, mortgage follow-through, or post-sale service lack coordination | Separate CRM notes/tasks may support an in-scope transaction; accounting, payments, rental operations and consumer finance are separate products/phases | P2 / separate direction | `product.md` §14, §20; `_unsort/5.md` #22/#37/#47; `_unsort/12.md` #13/#18/#28/#31/#36/#37/#44/#46; `IjarachiPRD.md`; `KvartiramniPRD.md` |
| UZ-18 | Broad marketplace, MLS, valuation, developer inventory, and market-data problems, including comparable prices by area/building and developer price lists | Keep visible in a deferred/validation register; no top-level CRM navigation until a separate product decision and evidence justify it | P2 / separate direction | `product.md` §20–21, §28; `_unsort/5.md` #31/#46; `_unsort/12.md` #12/#30/#32/#39/#42; `ValoraPRD.md`; `SmartChessPRD.md`; `DealRadarConcept.md` |
| UZ-19 | Newcomer education, certification, regulation, and changing local rules | Represent as a source-linked checklist or help placeholder only after the current rule is verified; legal advice/certification is not a CRM promise | P1/P2 / validation gate | `product.md` §18, §37; `_unsort/5.md` #45; `_unsort/12.md` #8/#14/#19 |
| UZ-20 | The product's first value is hard to experience or explain; referrals/recommendations are not systematically captured; agencies lack a measurable lead-acquisition loop | Guided demo or sample workspace, short activation checklist, first completed lead-to-next-step outcome, evidence card based on the agency's own baseline, source/referral capture and team invite; measure lead flow/referrals before adding incentives or promising acquisition | P0 activation / P1 growth validation | `product.md` §19, §22, §25, §29, §33; `_unsort/5.md` #43; `_unsort/2.md` #43; `_unsort/12.md` #2; `PropCopilotPRD.md`; `AiRealtorAssistantValidationPlan.md`; `CloserOsProductMarketFitBlueprint.md` |

### Source-to-scope rule

Pain clusters UZ-01–UZ-12 are the agency CRM pilot's main design territory. UZ-13–UZ-16 and UZ-20 may be represented as a thin workflow or later capability according to verified agency demand. UZ-17–UZ-19 include valuable pains, but their source concepts span owners, consumers, landlords, developers, and regulatory products; do not silently treat these as committed CRM screens. Every unique pain statement found across the supplied documents must receive a disposition: design now, design later, separate direction, needs evidence, or out of scope with reason. Preserve every source reference, including repeated statements, without double-counting them as separately validated pains.

## 8. Screen and flow inventory

The prototype already contains Today, Leads, Match, Calendar, Objects, Deals, Team, Analytics, and object create/edit/detail/import routes. The plan must treat these as existing surfaces to refine, not assume they are missing. Required additions or clarified roles are listed below.

### P0 — close the core value loop

1. **Today (agent queue):** urgent/new leads, due work, today's viewings, leads without next action; filters and empty state.
2. **Leads / Inbox:** list states (new, assigned, awaiting reply, active, overdue, closed); source, owner, response time and fast actions.
3. **Lead detail:** client/request links, interaction timeline, notes, next action, response draft, handoff/assignment and role-sensitive fields.
4. **Quick capture / request extraction:** paste text, enter manually, attach a demo image, or record a short note; extraction draft, uncertainty, edit/confirm/reject, invalid/missing values, create lead and preserve linkage. Voice/image processing may be simulated; do not imply call recording or guaranteed recognition quality.
5. **Client and request editor:** multiple requests per person, explicit budget/currency, area aliases, preferences, unknowns, history and duplicate warning.
6. **Matching:** exact vs near matches, filters, reason/exclusion, stale/unverified state, no results and change request.
7. **Property capture/detail/freshness:** manual or approved-file capture with optional photos; price/currency, availability, source, last checked, responsible party, internal vs client-visible data. Image/voice extraction remains a draft for human confirmation.
8. **Selection preview and share record:** selected properties, client-safe preview, remove/return to match, simulated confirmation, history record and failure/retry state.
9. **Viewing create/detail:** client/property/agent/date, conflict, confirm, move/cancel, reminder preview, attendance/no-show/outcome and follow-up.
10. **Tasks and follow-up:** create from a lead/showing, draft message, due/snoozed/overdue/completed, no-contact-permission state.
11. **Deal detail and pipeline transition:** linked entities, stage, timeline, next step, loss reason, negotiation terms and documents summary. Commission is visible as expected/unapproved until confirmed.
12. **Owner Pulse:** new/overdue/unassigned leads, missing next steps, stale properties, viewings without outcome, deals without update; every metric drills into records.
13. **Minimum onboarding and activation:** demo/skip path, agency/user basics, first record or sample data, short checklist to a lead with owner/next step or a reviewed property selection, and a value summary based on labeled demo or agency data. Full migration wizard remains in P1; do not block a prototype demo on external integrations.

### P1 — adoption and agency operations

14. **Full onboarding and data migration:** choose data type (contacts/leads/properties/active deals), map columns, preview, validation, duplicates, dry-run, confirmation, result log and safe repeat/cancel behavior.
15. **Account, team and access:** sign-up/agency creation or accept invitation, invite pending/accepted/error states, roles and data scope explanation, suspend/revoke/handover preview. Production authentication remains an engineering dependency.
16. **Lead routing settings:** manual and simple round-robin setup, no-eligible-agent and failed assignment states; advanced AI routing is not assumed.
17. **Commission workspace:** transparent calculation inputs, expected/approved/received states, correction reason, partner split and confirmation trail.
18. **Partner workflow (limited):** share only approved transaction fields, state purpose/access, agree/confirm terms, show history and revoke future access.
19. **Settings:** agency profile, languages, notifications, roles, routing and integration placeholders with connection/unsupported/error states.
20. **Analytics and drill-down:** choose period, agent, source; define metrics; open records behind values; empty/partial-data and permission states.
21. **Search:** leads/clients/properties/deals with loading/no-result/permission/ambiguous-name states and RU/UZ spelling behavior.
22. **Owner/listing workspace:** owner contact, authorization/source, listing status, update history and safe reminders; only if pilot discovery confirms this as a frequent agency job.
23. **Document checklist:** transaction-linked document list and status. Templates, signatures, legal conclusions and government checks remain excluded unless separately validated.
24. **Privacy and data control:** consent/legal-basis status where relevant, role/access summary, export request, deletion/retention request, confirmation and completion/error states. Legal wording and retention rules require review; the UI does not decide legal eligibility.
25. **Commercial entry and subscription (conditional):** public demo/preview handoff, sign-up or request-pilot route, trial status, included limits, plan comparison, upgrade/contact-sales route, payment result/retry, cancellation/export and data-retention explanation. Keep any marketing landing separate from CRM navigation. Design only the minimal path supported by the pilot sales model; do not build a speculative billing system or invent prices.
26. **Referral and proof sharing (validation-first):** record referral source and provide an optional team/customer introduction path. Rewards, public counters and claims stay out until economics and consent are tested.

### P2 / separate product directions

- Automatic outbound, autonomous AI qualification/replies, voice AI, automatic call recording, speech analytics, and prediction/scoring requiring reliable data.
- Scraping/classified integrations, broad live-market radar, owner lead-generation product, MLS/inter-agency marketplace, consumer-facing marketplace.
- Automated legal/compliance claims, digital signatures, government/registry checks, tax/accounting/financial product, payment collection.
- Automated property valuation, developer/investment inventory, landlord/property-management, mortgage comparison, construction quality/trust, and UAE/Dubai workflows.

P2 ideas are still captured in the final pain crosswalk with a reason and validation/dependency; “deferred” must not erase them from the source inventory.

## 9. State and interaction requirements

For each P0 screen, and for the relevant P1 setup flows, specify at minimum:

- loading/skeleton and success;
- first-use/empty state with a clear next action;
- no exact match vs no match at all;
- missing, uncertain, stale, or conflicting data;
- validation errors and recovery guidance;
- permission denied, unassigned, revoked, or partially visible data;
- save, cancel, undo/confirmation, retry, and unsaved changes;
- duplicate warning without automatic merge;
- offline/weak-network banner, locally queued draft/action, retry, sync result and conflict-resolution state; never show a queued action as externally delivered;
- consent/source context, export/delete/retention request status, and audit-friendly confirmation for sensitive actions;
- date/time conflict, reschedule, cancellation, and no-show;
- simulated/unavailable integration and user-controlled fallback;
- mobile layout, keyboard-safe form behavior, and desktop density;
- RU and UZ text expansion, Latin/Cyrillic search variants where applicable, date/number/currency clarity.

Do not make a destructive or externally visible action the only primary CTA. Always distinguish draft from sent, scheduled from confirmed, proposed commission from approved/received, and AI-suggested from human-confirmed.

## 10. Uzbekistan-specific design checks

- Russian and Uzbek localization with a visible language choice and persistence in the prototype; validate preferred Uzbek script(s) with pilot users rather than guessing.
- Tashkent districts, neighborhood aliases and transliteration are search vocabulary requiring real-user review. Keep the entered phrase visible when normalization/matching occurs.
- Normalize phone display and make country code explicit; do not use phone equality alone to merge contacts.
- Show local date/time and Asia/Tashkent context consistently; include time zone when showing external calendar placeholders.
- Make UZS vs USD explicit on every price/budget; preserve entered currency and show conversion only with source/time and user acknowledgment if later designed.
- Support varied device widths and low-attention, on-the-go usage; never require a long form before the agent can save a lead or note.
- Show weak-network/offline mode, pending local actions and synchronization status. Do not imply that every action is safely queued unless that behavior is included in the engineering contract.
- Preserve consent and source context for contact/marketing actions; give an understandable export and data-deletion request path, subject to legal/retention rules.
- Do not state current law, certification, consent, escrow, tax, or integration availability as fact solely because a concept document mentions it. Such claims require dated authoritative verification before becoming UI copy.

## 11. Design principles and reusable patterns

1. **One primary action per screen.** Secondary operations stay available without competing for attention.
2. **Capture once, reuse everywhere.** Confirmed client needs and property facts feed match, viewing, follow-up, deal, and analytics.
3. **Explain consequential suggestions.** Show source, timestamp, confidence/status and reason for match/next step; allow correction.
4. **Human controls consequential actions.** Sending, sharing a contact, changing a deal stage, approving a commission, or merging records requires explicit confirmation.
5. **Privacy by presentation.** Mark internal-only and client-visible data at the point of preview; partner access is least-privilege.
6. **Freshness before polish.** A beautiful stale property card is a product failure; freshness is visible and actionable.
7. **Progressive detail.** Quick actions for the field; full timeline and audit context when needed.
8. **Evidence-led dashboard.** Avoid vanity totals and unsupported ROI claims; every metric has a definition and route to underlying records.
9. **Prototype honesty.** Label demo data, simulated sends/integrations, and unverified AI. Do not create fake testimonials, market outcomes, certifications, or partner proof.

## 12. Prioritization and design sequencing

Use P0/P1/P2 as order of design depth, not a promise about engineering release dates:

- **P0:** close the core loop and make its trust/safety states demonstrable. Prioritize lead leakage, client context, matching/property freshness, selection, viewing, follow-up, deal visibility, and manager exceptions.
- **P1:** reduce adoption friction and make the agency workflow operable: robust import, roles/team, routing, partner/commission basics, analytics drill-down, settings, and confirmed owner/listing workflows.
- **P2:** integrations or automation with material external, data-quality, legal, or cold-start dependencies; separate products remain separate until evidence supports expansion.

### Self-selling and growth logic

Treat self-selling as a testable sequence, not a brand claim:

1. **Preview:** the user understands the core scenario without connecting an unsupported channel or uploading sensitive data.
2. **Activate:** guide the agent to one useful outcome with demo data or a small safe import/manual entry; measure time to first completed workflow instead of asserting a fixed target from another concept document.
3. **Prove:** show only pilot data with definitions and a comparison baseline; distinguish activity, response, viewings, deals, and received commission. Never turn sample data into a testimonial or ROI promise.
4. **Expand:** help the manager invite the team after one agent sees value; test repeated team use and willingness to pay without founder-led training.
5. **Refer:** track recommendation source first. Introduce discounts/rewards only after checking economics, abuse, and consent. A shareable property selection is a client-service function, not by itself a SaaS referral loop.

The first three steps belong in the P0 prototype story; subscription/pricing and referral mechanics are P1 validation surfaces, and incentive automation is P2 until validated. Solo-vs-Team packaging remains a discovery gate because source documents disagree about the first buyer.

There are sequencing tensions to resolve explicitly in the final plan: (1) `product.md` treats import as MVP readiness, while the agreed design sequence places full import in P1; design a P0 first-use/demo path and minimum manual capture, while treating the robust migration wizard as P1 design depth and an explicit pilot-readiness gate; elevate its minimum viable slice if the first agency depends on import. (2) The corpus proposes Solo and Team buyers and different packaging models; use agency/team as the pilot assumption but test the Solo entry path before locking pricing or navigation. (3) Subscription lifecycle concepts are much broader than a pilot needs; present only the minimum trial/upgrade/exit path consistent with the validated sales model.

## 13. Handoff acceptance criteria

The later designer plan is complete when:

1. All 47 rows of `_unsort/5.md`, all 46 rows of `_unsort/12.md`, and every unique pain statement in the remaining source corpus have a source-qualified ID and explicit disposition; no catalog ID is unmatched, and duplicate statements retain their references without being double-counted.
2. Every pilot-core pain maps to a screen/scenario, a role, a priority, and observable acceptance criteria.
3. P0 flows are clickable from start to result using linked demo records, not isolated mock screens.
4. The screen inventory distinguishes existing routes, redesign/refinement, and genuinely new surfaces.
5. Critical states and responsive behavior are specified for P0; all important P1 setup/permission/error states are included.
6. The first-value activation flow and evidence card use a declared activation event, a baseline, and real/synthetic-data labels; no fictional ROI or testimonial is used.
7. Weak-network/offline queue, retry, sync and conflict states are specified for critical agent actions.
8. Every simulated API, AI operation, send, import, calendar update, payment, or permission check is labeled as simulated or handed off as an explicit dependency.
9. The client selection preview and partner view disclose no internal-only fields; consent/source and export/delete controls have an explicit UX disposition.
10. Language, currency, data freshness, source attribution, roles, and metric definitions are unambiguous enough for a developer to build against.
11. Deferred features remain visible in a separate register with their pain, reason, dependency, and evidence needed to revisit.
12. Usability validation scenarios and a developer handoff checklist are included; passing a visual review alone is not treated as validating the product hypothesis.
13. The plan is a self-contained cloud handoff for collaborators who may not have the source folder: no local filesystem paths, file links, or dependency on opening another local document. It carries the relevant product context, findings, decisions, assumptions, screen/state requirements, pain-to-solution crosswalk, and validation gates inside the plan itself.
14. Source provenance is preserved inside the plan using human-readable document titles, version/date where known, and stable source pain IDs/section labels; provenance must not become a local link that a remote collaborator cannot open. Summarize the evidence needed to understand each decision instead of asking the reader to consult a local file.

## 14. Decisions captured; no further discovery questions required to draft the plan

- Use the Uzbekistan agency CRM as the pilot boundary and Tashkent as the initial working context.
- Treat the current PRD as the product anchor and the broad source corpus as hypotheses/alternatives to reconcile.
- Keep agent Today, lead Inbox, owner Pulse, and historical Analytics as distinct jobs, even if navigation or layout reuses components.
- A lead list is the MVP inbox until a real multi-channel conversation workflow is verified.
- Support a responsive web prototype, not a native app or Telegram Mini App, unless a separate decision changes that scope.
- Include end-to-end client selection and viewing flows; simulated sends remain visibly simulated.
- Keep full migration, advanced routing, partner network, outbound AI, scraping, financial automation, legal verification, and adjacent products at the priority/dependency levels above.
- Include a testable first-value and proof-of-value path; do not assume self-serve conversion, referral virality, or a specific Solo/Team packaging model.
- Include cross-cutting offline/sync and privacy/export/delete states; implementation and legal behavior remain engineering/legal gates.
- Record uncertain market, legal, AI-quality, and integration assumptions as validation gates inside the plan instead of blocking the document on more interviews now.

## 15. Source set for the plan

Primary local references:

- `docs/product.md`
- `docs/implementation-gap-audit.md` (read-only reference; existing untracked file)
- `docs/superpowers/plans/2026-10-16-objects-workflow.md`
- `docs/superpowers/plans/2026-10-16-lead-capture-workflow.md`
- `docs/superpowers/specs/2026-10-16-objects-workflow-design.md`
- External `Product/DesignConcept.md` (subscription/UI concept only, not the pilot's approved scope)
- External `Product/AiRealtorAssistantValidationPlan.md` (activation/referral hypotheses)
- External `Product/PropCopilotPRD.md` (time-to-value hypothesis)
- External `Product/CloserOsProductMarketFitBlueprint.md` (activation/referral concepts in an alternate product context)

External document sets supplied for this task:

- `/Users/shohsanam/Desktop/design/prompt/documents/Projects/SmartAgent/docs/_unsort/*.md`
- `/Users/shohsanam/Desktop/design/prompt/documents/Projects/SmartAgent/docs/Product/*.md`

The final plan should include a source manifest grouped by product direction and a pain-ID crosswalk rather than copying every competing concept into the CRM design. The plan itself must remain portable and self-contained: include the useful source context and rationale in the plan, identify provenance by title/version/date and pain IDs, and do not add local filesystem paths or links to source documents or this specification.
