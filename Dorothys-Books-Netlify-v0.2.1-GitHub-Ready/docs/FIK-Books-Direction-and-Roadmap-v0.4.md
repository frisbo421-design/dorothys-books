# Dorothy's Books · FIK Finance System / v0.4 direction and roadmap

## North star
Two named human operators, one company ledger and audit trail. The primary owner and Darius have independent credentials and company-scoped memberships; NEVER merge passwords, user IDs, sessions, or duplicate financial data. If a second company has records, migrate only after ledger reconciliation and owner approval. No assumption that a Snout email equals a Books email. Preserve the independent Netlify PostgreSQL database.

## The operating standard
FIK: Direction → Principles → Execution → Verification. A finance tool is a system of truth before a spectacle. Real values, causal animation, transparent source/cadence, no fabricated metrics, rollback, accessibility, progressive disclosure and human review. Current source: existing posted journals and manual CSV banking; bank feeds are not connected.

### Motion direction
- **Direction:** An instrument panel that responds to real data, not vague futuristic glow.
- **Principles:** For attention, not decoration. GSAP = arrivals of information, chart transitions. Lenis = deliberate scroll on desktop only. ECharts = editable-in-source, accessible tooltip-backed six-month data, with SVG renderer and real ledger inputs.
- **Execution:** Subtle dashboard headline/stagger, chart only on Overview, durable tables/inputs, no motion to suggest a live bank connection. One ticker, cleanup on rerender, no multiple GSAP contexts, CSS fallback if bundles fail. Source packages pinned and delivered from own site with existing CSP, no CDN runtime.
- **Verification:** Tests check actual source fields, no invented numbers, reduced-motion support, mobile no Lenis, chart fallback, all previous double-entry/account tests pass. Test navigation, modal, scroll, authentication, and multi-user sharing in the browser before production records.
- **Taste veto:** No oversized random gradients, 'STUDIO / 001' eyebrow, italic giant marketing headlines in bookkeeping, endless pill badges, needless floating bento cards, constant count-up animations, fake live indicators or simulated balances.

## What has shipped in v0.4 source
- Ledger UI design system with stronger typography, useful dashboard hierarchy, responsive panels and stable forms.
- Motion layer: GSAP reveal (reduced-motion aware), Lenis (desktop-only), ECharts interactive source-backed 6-month revenue/expense/net-result series.
- Accounting review queue: unreviewed bank rows, overdue invoices and overdue bills from Books' existing dashboard.
- No migration, no new accounting writes, no Snout booking sync, no bank connection.

## Build priorities (based on official QuickBooks and LedgerFi capability research)
### P0 — Audit, accounts, reconciled reality
1. **Shared workspace verification:** inspect real memberships; invited Darius must share the existing company ID, no new company. Display role, last access, and owner-restricted invites; separate Snout identity linking by explicit verified UID mapping, NOT matching address strings alone.
2. **Finance close and verification:** month-end 4-step checklist (bank reconciliation, unresolved classifications, uncleared receivables/payables, lock period). Log actor/time, preserve audit and reversals.
3. **Bank import quality:** match imported lines to *already-posted* invoices/payment entries rather than create duplicate revenue. Strict idempotency, date+amount+memo candidates, human confirmation; never treat $0 prepaid checkouts as lost revenue. Bank CSV statements need source period and import freshness.
4. **Receipts and vendor bills:** upload original files privately, scanned fields offered as drafts only; manual approval, audit history, OCR uncertainty, not sensitive data pasted into prompts.
5. **Accountant export and restore drill:** backup, journal history and reports; evidence that a restoration succeeds before relying on app as a primary system.

### P1 — Dorothy's business economics
6. **Budget vs actual:** monthly budget per cost center (payroll, rent, marketing, software) and service revenues daycare/boarding/walks; report deviations and explanations.
7. **Recurring liabilities:** rent, utilities, software, insurance, loans and vendor bills with due dates, optional draft posting; not automatic payments.
8. **Cash control / Profit First:** separate virtual buckets (tax, payroll, owner's pay, operating, profit) as allocation plans, never claim money moved. Prepaid dog packages and client credits recognized as liabilities or deferred revenue until earned. Pay-rate scenario analysis with Darius approval before journal posting.
9. **Snout ops mapping:** one-way imported events from verified settled invoices/payments/refunds, processor fees, tax, credit movement. Explicit external source IDs + idempotency keys, review queue before posting, reconciliation proof.
10. **Operational profit:** profitability by daycare / boarding / walks, real dog-days / boarding nights, transport and payroll cost allocation. Only when input sources validated.

### P2 — Advisor not oracle
11. Forecast cash runway with editable assumptions, uncertainty bounds, salary affordability and staffing scenario tests; user can interrogate source records.
12. LedgerFi-style review package: monthly narrative with citations to actual journal/statement items, unresolved exceptions, tax questions for a qualified advisor, meeting notes and accepted actions.
13. Contract and tax document vault, accountant access limited by role, audit log of access/exports, close policy, sales tax-specific treatment guided by professional review.

## Evidence and code reference links
- LedgerFi pricing and scopes: https://www.ledgerfi.co/pricing
- LedgerFi human expertise and portability: https://www.ledgerfi.co/about
- QuickBooks bank matching: https://quickbooks.intuit.com/learn-support/en-us/help-article/bank-feeds/match-online-bank-transactions-quickbooks-online/L6qyw0PvP_US_en_US
- QuickBooks audit log: https://quickbooks.intuit.com/learn-support/en-us/help-article/audit-log/use-audit-log-quickbooks-online/L2WoVnW6I_US_en_US
- GSAP React skill (MIT guidance): https://github.com/greensock/gsap-skills/blob/main/skills/gsap-react/SKILL.md
- GSAP core: https://github.com/greensock/GSAP
- Lenis integration: https://github.com/darkroomengineering/lenis/blob/main/README.md
- Apache ECharts examples (TypeScript sources): https://github.com/apache/echarts-examples
- ECharts license: https://github.com/apache/echarts

## Release gates
1. Existing protected company and team permissions remain correct (positive and negative tests).
2. Additive migration only if a real ledger change is approved; never edit an applied migration.
3. No silently rerouted payment requests, unapproved expenses, or bank transfers. Keep Snout separate for payment operations.
4. Human checks: charts honor real zero/negative data, empty and demo states, no mobile sticky conflicts, nav and modal scroll, reduced motion, useful static fallback.
5. Require successful GitHub -> Netlify deploy before marking a feature live.
