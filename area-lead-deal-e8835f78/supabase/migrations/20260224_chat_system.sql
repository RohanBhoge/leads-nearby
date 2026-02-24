-- ============================================
-- Chat System: Tables, RLS, Indexes, Realtime
-- ============================================

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at       TIMESTAMPTZ DEFAULT now(),
  last_read_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- 3. Messages table (stores encrypted content)
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id),
  ciphertext      TEXT NOT NULL,
  iv              TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. User public keys for E2E encryption
CREATE TABLE IF NOT EXISTS user_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  public_key  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_user_keys_user ON user_keys(user_id);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;

-- Conversations: users can see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

-- Conversation participants: users can see participants of their conversations
CREATE POLICY "Users can view participants of own conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can add participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Messages: users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages as themselves"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
  );

-- User keys: public keys readable by any auth user, writable by owner
CREATE POLICY "Authenticated users can read public keys"
  ON user_keys FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own key"
  ON user_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own key"
  ON user_keys FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- Enable Realtime on messages table
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- Auto-update updated_at on conversations
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
