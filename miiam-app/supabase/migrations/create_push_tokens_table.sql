CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT DEFAULT 'web',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manage push_tokens"
  ON push_tokens FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated insert push_tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated update own push_tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated delete own push_tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);
