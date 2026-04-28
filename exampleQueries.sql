-- exampleQueries.sql — Example queries for Quran character-based memorization

-- Calculate memorization for a range of verses
-- Usage: Memorized proportion = sum(quran_fraction) for the range
-- Hizb = proportion * 60

-- Example: Surah Al-Baqarah, verses 1 to 10
SELECT SUM(quran_fraction) AS memorized_proportion,
       SUM(quran_fraction) * 60 AS memorized_hizb
FROM verses
WHERE surah_id = 2 AND ayah_number BETWEEN 1 AND 10;

-- Example: Entire Surah Al-Fatiha
SELECT SUM(quran_fraction) AS memorized_proportion,
       SUM(quran_fraction) * 60 AS memorized_hizb
FROM verses
WHERE surah_id = 1;

-- Example: Multiple ranges (union)
SELECT SUM(quran_fraction) AS memorized_proportion,
       SUM(quran_fraction) * 60 AS memorized_hizb
FROM verses
WHERE (surah_id = 1 AND ayah_number BETWEEN 1 AND 7)
   OR (surah_id = 2 AND ayah_number BETWEEN 1 AND 5);

-- Get verse details with fractions
SELECT surah_id, ayah_number, char_count, quran_fraction,
       quran_fraction * 60 AS hizb_fraction
FROM verses
WHERE surah_id = 1;

-- Total characters in Quran
SELECT SUM(char_count) AS total_characters
FROM verses;

-- Verify sum of fractions = 1.0
SELECT SUM(quran_fraction) AS total_fraction
FROM verses;