-- User session & login-event tracking for the /settings/security/devices view.
-- Both tables are scoped by user_id with RLS so users only see their own data.

CREATE TABLE IF NOT EXISTS user_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token   TEXT NOT NULL,
  device_info     JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address      TEXT,
  user_agent      TEXT,
  location_label  TEXT,
  is_current      BOOLEAN NOT NULL DEFAULT FALSE,
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_token_key
  ON user_sessions (session_token);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx
  ON user_sessions (user_id, last_active_at DESC);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own sessions" ON user_sessions;
CREATE POLICY "Users read their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their own sessions" ON user_sessions;
CREATE POLICY "Users insert their own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their own sessions" ON user_sessions;
CREATE POLICY "Users update their own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their own sessions" ON user_sessions;
CREATE POLICY "Users delete their own sessions"
  ON user_sessions FOR DELETE
  USING (auth.uid() = user_id);


CREATE TABLE IF NOT EXISTS login_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL, -- 'login' | 'logout' | 'login_failed' | 'session_revoked'
  ip_address  TEXT,
  user_agent  TEXT,
  device_info JSONB,
  location_label TEXT,
  success     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS login_events_user_id_idx
  ON login_events (user_id, created_at DESC);

ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own login events" ON login_events;
CREATE POLICY "Users read their own login events"
  ON login_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their own login events" ON login_events;
CREATE POLICY "Users insert their own login events"
  ON login_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
