-- New schema: adds separately authenticated business owners to existing company.
-- Preserve previous migration and existing journal entries.
ALTER TABLE users DROP COLUMN owner_slot;
CREATE TABLE company_memberships (
 company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('owner')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(company_id,user_id)
);
CREATE TABLE company_invitations (
 id BIGSERIAL PRIMARY KEY,
 company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
 email TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('owner')),
 token_hash CHAR(64) NOT NULL UNIQUE,
 created_by INTEGER NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
 accepted_at TIMESTAMPTZ
);
CREATE INDEX idx_company_memberships_user ON company_memberships(user_id);
CREATE INDEX idx_company_invitations_company ON company_invitations(company_id,created_at DESC);
