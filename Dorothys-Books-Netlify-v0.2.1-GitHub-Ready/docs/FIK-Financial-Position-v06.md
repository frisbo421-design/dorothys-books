# Dorothy's Books · FIK Financial Position v0.6

## Find
Dorothy's Books is a two-owner accounting workspace for a New York City dog-daycare operation, with a PostgreSQL double-entry ledger, a manually imported bank review queue, invoices and bills. Its users need to understand financial position and resolve exceptions without confusing posted accounting entries with live bank transactions.

**Previous problem:** The v0.4 dashboard relied on four interchangeable metric cards, a small six-month visualization and separated attention lists. Despite a refreshed palette, this left the primary financial relationship and daily priorities visually fragmented.

## Interpret
**Design premise:** A financial instrument, not a SaaS marketing dashboard. Show one causal story:
- Operating result is the flagship financial position, including negative/zero states.
- Money Flow expresses recognized revenue less recognized expenses, using a common max-based visual scale so losses are not concealed. No fake animated money counts.
- The balance rail integrates cash, receivables, payables and revenue without cards.
- Performance chart and period pressure explain trends and obligations.
- An attention queue routes to actual Banking, Sales or Expense pages.
- Ledger history sits immediately below decisions as supporting evidence.

**Art direction:** Deep pine #152c23, ivory #f1f2ee, sage #e9eee6, copper #cf6139; DM Sans for readable hierarchy, monospaced annotations for record metadata only; optical alignment, gentle rectangular corners, semantic color. No invented metrics, generic starbursts, numbered skill/bento ornaments, arbitrary 3D assets, fake live statuses or incompatible fonts.

## Keep: what changed
- Added scoped src-independent plain-JS composition in public/fik-books-v06.js, source-ledger data only.
- Added new CSS for editorial layout, dark two-column money-flow stage, integrated numbers, responsive chart, meaningful review rows and financial record provenance.
- Enhanced existing GSAP motion controller for one-time narrative reveals, line/flow bars, performance sections; keeps cleanup, reduced-motion and chart fallback. Existing Lenis only runs in desktop overview, not banking/entry forms.
- Added command navigation (⌘K / Ctrl+K) with accessible dialog semantics and keyboard focus management, as a faster alternative to deep sidebar navigation. No persistent financial-data cache.
- Updated inaccurate Settings copy regarding SQLite backup and Snout being wholly disconnected; live bank/feed sync remains explicitly unavailable.

## Boundaries
Presentation only. The financial ledger API, authentication, shared company membership, reports, payment and bank matching data were not modified. Books has a separate Netlify PostgreSQL source of truth; Snout's read-only Finance bridge and PIN gate remain independent. Snout-to-Books automatic transaction posting and Darius's email-to-UID mapping are not fixed by this visual release.

## Verification
- Browser-source syntax parsed through V8 for app and motion modules.
- Rendered markup through a source-evaluation harness for profit, loss and empty states with no NaN/undefined/infinite values and true ledger-based labels.
- Node regression checks included in tests/fik-financial-position.test.mjs; production CI must run npm run check && npm test && npm run vendor:prepare.
- Authentic signed-in browser screenshot review at 1440px, 768px, 375px remains to be completed. Test Ctrl/⌘+K focus, reduced motion, bank import modal scrolling, report navigation, long and negative financial values, and cross-user sign-ins before relying on it for bookkeeping.
- Do not describe this as proven better than QuickBooks without comparable task completion/usability tests.

## Useful open-source foundations
- GSAP: https://github.com/greensock/GSAP
- Lenis: https://github.com/darkroomengineering/lenis
- ECharts examples: https://github.com/apache/echarts-examples
- Recharts: https://github.com/recharts/recharts
- Official 2026 QuickBooks new interface: https://quickbooks.intuit.com/global/resources/product-update/quickbooks-new-experience-defaults/
