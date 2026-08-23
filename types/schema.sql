-- ===========================================================================
-- VERO — Auth & Onboarding relational schema (portable SQL)
-- All onboarding answers are bound to user_id via FK. Mirrors types/schema.ts.
-- ===========================================================================

CREATE TABLE users (
    id          TEXT PRIMARY KEY,            -- "u_ab12cd"
    email       TEXT NOT NULL UNIQUE,        -- lowercased
    username    TEXT NOT NULL,
    name        TEXT NOT NULL,
    avatar      TEXT NOT NULL DEFAULT '',
    pw_hash     TEXT NOT NULL,               -- bcrypt/argon2 in production
    created_at  BIGINT NOT NULL
);

CREATE TABLE user_preferences (
    user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    scope          TEXT CHECK (scope IN ('fashion','art','both')),
    intent         TEXT CHECK (intent IN ('buy','sell','both','explore')),
    fashion_styles TEXT[] NOT NULL DEFAULT '{}',   -- multi-select tags
    art_categories TEXT[] NOT NULL DEFAULT '{}',   -- multi-select tags
    skipped        BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at     BIGINT NOT NULL
);

CREATE TABLE user_sizes (
    user_id      TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    shirt        TEXT CHECK (shirt   IN ('XXS','XS','S','M','L','XL','XXL','Custom')),
    pants_eu     SMALLINT CHECK (pants_eu BETWEEN 34 AND 46),
    jacket       TEXT CHECK (jacket  IN ('XXS','XS','S','M','L','XL','XXL')),
    coat         TEXT CHECK (coat    IN ('XXS','XS','S','M','L','XL','XXL')),
    hat          TEXT CHECK (hat     IN ('S','M','L','One size')),
    glasses      TEXT CHECK (glasses IN ('Narrow','Regular','Wide')),
    gloves       TEXT CHECK (gloves  IN ('XS','S','M','L','XL')),
    updated_at   BIGINT NOT NULL
);

-- Device-local roster of "saved accounts" for one-tap login. In a real system
-- refresh tokens live server-side (hashed) with a device binding; the client
-- keeps only an opaque handle in secure storage.
CREATE TABLE saved_accounts (
    device_id   TEXT NOT NULL,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh     TEXT NOT NULL,               -- sealed/opaque
    last_login  BIGINT NOT NULL,
    PRIMARY KEY (device_id, user_id)
);
