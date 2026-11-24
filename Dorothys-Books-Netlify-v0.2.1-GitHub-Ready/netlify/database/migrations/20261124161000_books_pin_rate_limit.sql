-- Brute-force limits for standalone PIN entry, persisted across Netlify invocations.
-- No bookkeeping tables, invoices, or journal entries are modified.
CREATE TABLE IF NOT EXISTS books_pin_attempts (
  scope TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ
);
