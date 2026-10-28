# Fix your existing Netlify site (lovely-sorbet-347eb2)

The original archive nested the project under `Dorothys-Books-Netlify-v0.2/`. Netlify Drop published files without putting `public/index.html` at its website root. That can show "Page not found" even when the deployment is marked published. Uploading only the `public/` folder is not a functional solution: the accounting API needs Netlify Functions and PostgreSQL.

## Use your existing Netlify project (recommended)

1. Unzip the **GitHub-Ready** archive. This copy's `package.json`, `netlify.toml`, `public/`, `backend/`, `netlify/`, `tests/`, and this guide are all AT THE ROOT of the extracted folder. Do not upload the original wrapper folder or upload the ZIP as a lone GitHub file.
2. On github.com, create a **private** repository, e.g. `dorothys-books`. Choose an empty repository (no starter README). On its repository home, click **uploading an existing file** or **Add file → Upload files**. Drag ALL the contents of the extracted folder into the upload box. Commit the upload. Make sure you can see `netlify.toml` and `package.json` directly at the repository's top level; `public/index.html` should be one folder inside.
3. In Netlify, open your EXISTING project `lovely-sorbet-347eb2`: https://app.netlify.com/projects/lovely-sorbet-347eb2. Choose **Project configuration → Developer settings → Continuous deployment → Repository → Link repository**. Choose GitHub, authorize access to the private repo, and select it. Do NOT create a second Netlify project.
4. Keep the repo **base directory blank**; build command: `npm run check && npm test`; publish directory: `public`; functions: `netlify/functions`. The included `netlify.toml` already declares these settings and Netlify should use them on Git builds.
5. Under **Project configuration → Environment variables**, add a secret named `BOOKS_SETUP_KEY` with a random, unique 24+-character value. Keep it private. You enter it only in the app's owner onboarding screen; never send it to ChatGPT or commit it to GitHub. Configure it for the Functions runtime and redeploy if you added it after the build.
6. Check **Data & Storage → Database**. The project needs a Netlify Database (Postgres), which requires a compatible credit-based account and may incur usage charges. The repository includes `@netlify/database` and an initial migration under `netlify/database/migrations/`; Netlify's supported Git build should provision/apply migrations if database access is available. If not, follow the database activation steps displayed in the dashboard. No historical Mac SQLite data is automatically transferred.
7. Open **Deploys → latest Git deploy → logs**. A successful build should report `npm run check` and 9 tests passing. Check **Functions** for the `api` function and **Data & Storage → Database** for database availability. A `Published` static deployment without the function or database is NOT a complete deployment.
8. Open https://lovely-sorbet-347eb2.netlify.app . The homepage should load. Create the owner login only after the database and setup key are working. Use the clearly labeled sample workspace first; do not enter real financial records before verifying logins, invoicing, reports and backups.

## Diagnosing a remaining problem

- **Still Page not found**: verify `public/index.html` appears as `/index.html` in the latest deploy's file explorer, confirm the latest deployment is the Git build (not the older Drop deploy), and check publish directory `public`.
- **Cloud database is not connected**: the Netlify Database is not provisioned / accessible. Review the DB tab, plan and build logs.
- **Setup is disabled**: set `BOOKS_SETUP_KEY` as a secret environment variable with Functions scope, then redeploy.
- **Function not found**: review Git deploy logs and Functions tab, not the static Drop uploader.

Security: This Netlify site currently indicates PUBLIC visitor access. That makes the login page publicly reachable. The app checks authenticated access to records server-side, but until deployment and access control are verified, treat it as a test environment and do not upload real business finances. Do not cancel LedgerFi until reconciled and checked by a qualified accountant.

Docs: https://docs.netlify.com/build/git-workflows/repo-permissions-linking/
Docs: https://docs.netlify.com/build/data-and-storage/netlify-database/getting-started/
