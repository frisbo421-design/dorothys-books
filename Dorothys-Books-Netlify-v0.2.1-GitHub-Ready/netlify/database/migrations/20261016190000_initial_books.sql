-- Dorothy's Books: independent cloud database (not the local SQLite database).
-- Monetary amounts stored as whole cents, journals are append-only.
CREATE TABLE users (
 id SERIAL PRIMARY KEY, owner_slot SMALLINT NOT NULL DEFAULT 1 UNIQUE CHECK (owner_slot=1),
 email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), expires_at BIGINT NOT NULL
);
CREATE TABLE companies (
 id SERIAL PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id), name TEXT NOT NULL,
 demo BOOLEAN NOT NULL DEFAULT FALSE, locked_through TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE accounts (
 id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id),
 code TEXT NOT NULL, name TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('asset','liability','equity','income','expense')),
 active BOOLEAN NOT NULL DEFAULT TRUE, UNIQUE(company_id,code)
);
CREATE TABLE journal_entries (
 id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id), date TEXT NOT NULL,
 memo TEXT NOT NULL, source_type TEXT NOT NULL, source_id INTEGER,
 reversed_entry_id INTEGER REFERENCES journal_entries(id), created_by INTEGER REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,source_type,source_id)
);
CREATE TABLE journal_lines (
 id SERIAL PRIMARY KEY, entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
 account_id INTEGER NOT NULL REFERENCES accounts(id),
 debit BIGINT NOT NULL DEFAULT 0 CHECK(debit>=0), credit BIGINT NOT NULL DEFAULT 0 CHECK(credit>=0),
 CONSTRAINT one_posting_side CHECK ((debit>0 AND credit=0) OR (credit>0 AND debit=0))
);
CREATE TABLE audit (
 id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id),
 user_id INTEGER REFERENCES users(id), action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE contacts (
 id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id),
 kind TEXT NOT NULL CHECK(kind IN ('customer','vendor')),
 name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE invoices (
 id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id),
 customer_id INTEGER NOT NULL REFERENCES contacts(id), number TEXT NOT NULL,
 date TEXT NOT NULL, due_date TEXT NOT NULL, memo TEXT NOT NULL DEFAULT '',
 total BIGINT NOT NULL CHECK(total>0), entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(company_id,number)
);
CREATE TABLE invoice_items (
 id SERIAL PRIMARY KEY, invoice_id INTEGER NOT NULL REFERENCES invoices(id),
 description TEXT NOT NULL, qty INTEGER NOT NULL CHECK(qty>0), unit_cents BIGINT NOT NULL CHECK(unit_cents>0),
 revenue_account_id INTEGER NOT NULL REFERENCES accounts(id)
);
CREATE TABLE invoice_payments (
 id SERIAL PRIMARY KEY, invoice_id INTEGER NOT NULL REFERENCES invoices(id), date TEXT NOT NULL,
 amount BIGINT NOT NULL CHECK(amount>0), bank_account_id INTEGER NOT NULL REFERENCES accounts(id),
 entry_id INTEGER NOT NULL REFERENCES journal_entries(id)
);
CREATE TABLE bills (
 id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id),
 vendor_id INTEGER NOT NULL REFERENCES contacts(id), number TEXT NOT NULL,
 date TEXT NOT NULL, due_date TEXT NOT NULL, memo TEXT NOT NULL DEFAULT '',
 total BIGINT NOT NULL CHECK(total>0), expense_account_id INTEGER NOT NULL REFERENCES accounts(id),
 entry_id INTEGER NOT NULL REFERENCES journal_entries(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE bill_payments (
 id SERIAL PRIMARY KEY, bill_id INTEGER NOT NULL REFERENCES bills(id), date TEXT NOT NULL,
 amount BIGINT NOT NULL CHECK(amount>0), bank_account_id INTEGER NOT NULL REFERENCES accounts(id),
 entry_id INTEGER NOT NULL REFERENCES journal_entries(id)
);
CREATE TABLE bank_import_batches (
 id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id),
 bank_account_id INTEGER NOT NULL REFERENCES accounts(id), filename TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE reconciliations (
 id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id),
 bank_account_id INTEGER NOT NULL REFERENCES accounts(id), end_date TEXT NOT NULL,
 opening_balance BIGINT NOT NULL, closing_balance BIGINT NOT NULL, cleared_count INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE bank_lines (
 id SERIAL PRIMARY KEY, company_id INTEGER NOT NULL REFERENCES companies(id),
 batch_id INTEGER NOT NULL REFERENCES bank_import_batches(id),
 bank_account_id INTEGER NOT NULL REFERENCES accounts(id),
 date TEXT NOT NULL, description TEXT NOT NULL, amount BIGINT NOT NULL CHECK(amount<>0),
 fingerprint TEXT NOT NULL, entry_id INTEGER REFERENCES journal_entries(id),
 reconciliation_id INTEGER REFERENCES reconciliations(id), UNIQUE(company_id,fingerprint)
);
CREATE INDEX idx_entries_company_date ON journal_entries(company_id,date);
CREATE UNIQUE INDEX idx_reversal_unique ON journal_entries(reversed_entry_id) WHERE reversed_entry_id IS NOT NULL;
CREATE INDEX idx_lines_account ON journal_lines(account_id);
CREATE INDEX idx_bank_company_account ON bank_lines(company_id,bank_account_id,date);

-- A database-level safeguard, including against application bugs.
CREATE FUNCTION refuse_posted_mutation() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Posted journal records are immutable; post a reversal'; END;
$$;
CREATE TRIGGER immutable_entries_update BEFORE UPDATE OR DELETE ON journal_entries
 FOR EACH ROW EXECUTE FUNCTION refuse_posted_mutation();
CREATE TRIGGER immutable_lines_update BEFORE UPDATE OR DELETE ON journal_lines
 FOR EACH ROW EXECUTE FUNCTION refuse_posted_mutation();
