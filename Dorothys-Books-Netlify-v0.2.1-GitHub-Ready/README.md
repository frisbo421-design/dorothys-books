# Dorothy's Books · Netlify v0.2

A cloud-ready, original QuickBooks-style accounting workspace for Dorothy's Petcare. Directed by FIK. Netlify Functions + Netlify Database (PostgreSQL) + static browser frontend. Includes searchable in-app help, a guided first-use tour, and a clearly segregated sample company.

## What changed from the Mac version?

- **No Mac `.command` launcher and no Python server.** Host the frontend and API on Netlify.
- **Persistent database on Netlify:** Postgres, not SQLite. It stores transactions on the server, so an owner can sign in from multiple devices.
- **Only one owner account can be created.** The setup screen requires the private `BOOKS_SETUP_KEY` that you put into Netlify, preventing strangers who discover your new site's URL from signing up as the owner.
- **Secure HttpOnly session cookies and server-side company access checks.** Journal changes use atomic transactions; posted entries cannot be deleted or edited without a reversing journal.
- **Your old data is NOT automatically migrated.** The `dorothys.sqlite3` file from the Mac remains on your computer. A future verified data migration is needed if you've entered real transactions there.

## Recommended deployment: Netlify + GitHub (no Mac Gatekeeper prompts)

1. **Unzip** `Dorothys-Books-Netlify-v0.2.zip`. You'll get one folder with `netlify.toml`, `package.json`, `public/`, `backend/`, and `netlify/` inside.
2. Create a **private GitHub repository** called `dorothys-books` and upload the folder's CONTENTS to its root, not a second wrapper folder. Include the hidden `.nvmrc` file if possible. Do not upload passwords, personal records, `dorothys.sqlite3`, or `.env` files. The `.gitignore` already excludes those local files.
3. In your Netlify team, choose **Add new project → Import an existing project → GitHub**. Select that repository. Netlify uses `netlify.toml` automatically: publish directory `public`; functions `netlify/functions`; build `npm run check && npm test`.
4. Set up the database: Netlify's **Database** feature requires a **Credit-based Netlify plan** and incurs usage credits. This project includes `@netlify/database` and a versioned SQL migration in `netlify/database/migrations/`. On a compatible site, Netlify detects/provisions the database and applies the migration during deployment. If not, follow **Data & Storage → Database** / `netlify database init` from Netlify's current docs and review build logs. Do not publicly share a deploy preview if it contains real financial data.
5. In **Site configuration → Environment variables**, create a new **secret** environment variable for Functions named **`BOOKS_SETUP_KEY`**. Use a hard-to-guess **24+ character random string**. Example to generate one in Mac Terminal: `openssl rand -hex 24`. **Do not paste the actual secret into ChatGPT, GitHub, or the source code.** Deploy or redeploy after setting the variable.
6. Open the Netlify URL in a browser. On the first setup screen, enter Darius's owner email and a strong unique password (10+ characters), plus the exact **owner setup code** from your Netlify environment variable. When the owner account is created, further signups are blocked. Afterwards you just log in normally.
7. Open **Help & tutorials** in the sidebar. The guided tour starts on the first visit and can be restarted from Help. Use the separately labeled demo workspace before putting in genuine bookkeeping entries.

**Do not drag just `public/` to Netlify Drop.** That would publish a static UI without the API and database, and the buttons would not work. For this full-stack version, use the **entire repo** and Git deployment. Netlify CLI is an alternative once dependencies and the database are configured.

### Netlify CLI alternative (developers)

Requires Node 20.12.2+ and a Netlify account:

```bash
npm install
npx netlify login
npx netlify init
npx netlify database status
npx netlify dev
```

Apply pending migrations to the local DB while `netlify dev` is running (`npx netlify database migrations apply`). For production use Netlify Git deployment as above, so migrations apply automatically and each change gets a build/test. A plain manual CLI deploy does not run the build command; install packages and run checks beforehand.

## Operating the books

After you log in:

1. Use **Settings** to create the separately labeled demo workspace and learn the workflows without posting to Dorothy's real company.
2. **Accounting → Opening balance** records a bank starting balance as cash versus owner's equity. Real existing businesses usually require more opening entries: loans, credit card balances, outstanding invoices and bills, taxes, and prior-year retained earnings. Have a qualified bookkeeper review opening entries.
3. **Transactions** adds income or expenses when they haven't already been represented by an invoice/bill or bank import. Every post contains balancing ledger lines.
4. **Sales & invoices** creates customers and invoices and records payments. The invoice posts receivables + revenue; payment posts bank + reverses receivable **without doubling income**.
5. **Bills & expenses** creates vendors, bills and bill payments. The bill posts payable + expense; paying the bill reduces cash + payable **without doubling expenses**.
6. **Banking** imports statement CSVs, identifies duplicates, stages unreviewed lines and categorizes movements. **Do not categorize a bank line again if you already posted that real-world movement manually.** Matching against previously entered items is not implemented yet.
7. **Reports** offers Profit & Loss, Balance Sheet, Trial Balance and General Ledger with CSV export, all from the posted ledger. **Darius insights** is deterministic, not an AI chatbot with live bank access.

**Data model:** integer-cent USD transactions, accrual bookkeeping, atomic double-entry journals, posting lock for closed periods, linked journals and source records, company ownership checks and audit log. The front end never stores bank credentials or your accounting database in localStorage (it stores only a non-sensitive selected company ID and tutorial progress). Owner login session is held in a Secure, HttpOnly, SameSite=Strict cookie.

## Security and financial limitations

- **Private record access does not mean private hosting:** Netlify serves a public login URL unless you enable a site-level access control; business data is protected behind the owner's server-authenticated API, but protect the URL if appropriate. Enable available Netlify access restrictions before exposing any sensitive records.
- The first version is **single-owner, password authentication only**, not a production security or compliance audit. No 2FA, invited bookkeeper roles, multi-approver controls, forensic audit certification, or automated backup restore workflow.
- Backups are your responsibility: configure and test your cloud database backup/export plan. Never place raw financial exports in a public repository or unencrypted shared directory.
- Netlify Functions and Database may incur usage credits. Review your plan, database limits and privacy/compliance obligations for financial records.
- Does **not** charge cards, connect bank accounts, run payroll, file taxes, calculate taxes, generate invoices as email/PDF, or sync Snout, Walker, or LedgerFi.
- CSV-based reconciliation is simplified, not a replacement for an accountant's bank reconciliation.
- **Do not cancel LedgerFi or a human bookkeeper** until historical balances, expenses, taxes, owner distributions, payroll and statements have been reconciled and qualified professionals confirm coverage.
- This code has unit tests and JavaScript syntax checks, **but production deployment, managed database migration and end-to-end cloud flows have not been exercised against your Netlify account**. Treat the first Netlify deploy as an acceptance-test environment until verified. Start with the demo company, verify financial reports, then enter real data if appropriate.

## Source layout

| Path | Purpose |
| --- | --- |
| `public/app.js` | Existing FIK interface adapted for cloud auth |
| `public/guide.js` | Guided tour, searchable tutorials, setup checklist |
| `public/style.css` | Responsive financial application design |
| `netlify/functions/api.mjs` | Owner auth, API, CSV exports, server-side authorization, transactions |
| `backend/ledger.mjs` | Postgres double-entry accounting engine and reporting |
| `netlify/database/migrations/20261016190000_initial_books.sql` | Versioned database schema / immutable ledger triggers |
| `netlify.toml` | Netlify build, security headers, function bundling |
| `tests/ledger.test.mjs` | Core financial logic, authorization-shape, date/amount, schema checks |

## Run source checks

```bash
node --check netlify/functions/api.mjs
node --check backend/ledger.mjs
node --check public/app.js
node --check public/guide.js
node --test tests/*.test.mjs
```

These tests check pure logic and simulated posting, not a live Postgres database. Before production use, execute integration tests on a provisioned test database, including invoice payment races, periods, statement imports, and database migration compatibility.

**Version 0.2 · October 16, 2026** — separate cloud codebase. It does not modify the Mac app, Snout, Walker, bank accounts, or any real bookkeeping records.
