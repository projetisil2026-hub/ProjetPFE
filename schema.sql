-- =============================================================================
-- Quran Hizb Memorization — SQLite Schema
-- Standard : Medina Mushaf, Hafs narration, 6 236 verses, 60 Ahzab, 30 Ajzaa
-- =============================================================================
-- Usage (Node.js): npx better-sqlite3  OR  node quranDbSeeder.js
-- Usage (CLI):     sqlite3 quran.db < schema.sql

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- SURAHS  (114 rows)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS surahs (
  id                  INTEGER PRIMARY KEY,   -- 1..114
  name_arabic         TEXT    NOT NULL,
  name_english        TEXT    NOT NULL,
  ayah_count          INTEGER NOT NULL CHECK (ayah_count > 0),
  revelation_type     TEXT    NOT NULL CHECK (revelation_type IN ('Meccan','Medinan'))
);

-- ---------------------------------------------------------------------------
-- HIZB_BOUNDARIES  (60 rows, reference table)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hizb_boundaries (
  hizb_number         INTEGER PRIMARY KEY CHECK (hizb_number BETWEEN 1 AND 60),
  juz_number          INTEGER NOT NULL    CHECK (juz_number  BETWEEN 1 AND 30),
  start_surah_id      INTEGER NOT NULL REFERENCES surahs(id),
  start_ayah          INTEGER NOT NULL CHECK (start_ayah >= 1),
  end_surah_id        INTEGER NOT NULL REFERENCES surahs(id),
  end_ayah            INTEGER NOT NULL CHECK (end_ayah   >= 1),
  total_verses        INTEGER NOT NULL CHECK (total_verses > 0)
);

-- ---------------------------------------------------------------------------
-- VERSES  (6 236 rows — the core table)
--
-- quran_fraction:
--   = char_count / total_characters_in_quran
--   ∑ per all verses = 1.0 exactly (equal character distribution).
--
-- clean_text: text without diacritics (tashkeel)
-- char_count: number of Arabic letters (ء to ي) in clean_text
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verses (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  surah_id             INTEGER NOT NULL REFERENCES surahs(id),
  ayah_number          INTEGER NOT NULL CHECK (ayah_number >= 1),
  text                 TEXT    NOT NULL,  -- Original Arabic text with diacritics
  clean_text           TEXT    NOT NULL,  -- Text without diacritics
  char_count           INTEGER NOT NULL CHECK (char_count >= 0),
  quran_fraction       REAL    NOT NULL CHECK (quran_fraction > 0),

  UNIQUE (surah_id, ayah_number)
);

-- ---------------------------------------------------------------------------
-- INDEXES  — optimised for the main query patterns:
--   1. Range lookup by (surah, ayah) — for memorization calculation
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_verses_surah_ayah ON verses (surah_id, ayah_number);

-- ---------------------------------------------------------------------------
-- SAMPLE SEED DATA — Full seed via quranDbSeeder.js (generates all 6 236 rows)
-- ---------------------------------------------------------------------------
