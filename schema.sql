-- ==========================================
-- 單字記憶大師 - Cloudflare D1 資料庫 Schema
-- ==========================================

-- 單字表：儲存使用者的所有單字資料
CREATE TABLE IF NOT EXISTS vocabulary (
  user_id TEXT NOT NULL,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  related_forms TEXT NOT NULL DEFAULT '[]',
  similar_words TEXT NOT NULL DEFAULT '[]',
  related_phrases TEXT NOT NULL DEFAULT '[]',
  example_sentence TEXT NOT NULL,
  example_translation TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '{"type":"lifestyle"}',
  teacher_explanation TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, word)
);

-- 索引：加速依使用者查詢
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON vocabulary(user_id);

-- 索引：加速依時間排序
CREATE INDEX IF NOT EXISTS idx_vocabulary_created_at ON vocabulary(user_id, created_at);
