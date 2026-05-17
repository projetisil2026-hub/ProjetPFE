/**
 * generate-quran-metadata.js
 *
 * One-time script that fetches the complete Quran text from the AlQuran Cloud
 * API (https://alquran.cloud) — free, no API key required — and computes an
 * exact word-count metadata record for every Ayah.
 *
 * Output: public/quran-metadata.json
 *
 * Usage:
 *   node scripts/generate-quran-metadata.js
 *   node scripts/generate-quran-metadata.js --validate-only
 *   node scripts/generate-quran-metadata.js --offline path/to/quran-uthmani.txt
 *
 * ═══════════════════════════════════════════════════════════════════
 * DATA SOURCE
 * ═══════════════════════════════════════════════════════════════════
 *
 * PRIMARY:   AlQuran Cloud API  https://api.alquran.cloud/v1/surah/{n}/ar.uthmani
 *   - Edition:   ar.uthmani  (Uthmani script, same as Medina Mushaf)
 *   - Coverage:  114 Surahs, 6 236 Ayahs
 *   - Bismillah: returned as a separate `basmala` field per Surah,
 *                NOT embedded in Ayah 1 text (except Surah 1).
 *   - No auth required; respectful rate limiting applied (200ms per Surah).
 *
 * OFFLINE ALTERNATIVE: Tanzil.net corpus
 *   Download quran-uthmani.txt from https://tanzil.net/download/
 *   Format: pipe-separated  surah|ayah|arabic_text
 *   Pass its path via --offline flag.
 *
 * Both sources produce identical word counts for the Uthmani text.
 *
 * ═══════════════════════════════════════════════════════════════════
 * VALIDATION CHECKS (run automatically after generation)
 * ═══════════════════════════════════════════════════════════════════
 *  1. Exactly 6 236 Ayahs present
 *  2. No Ayah has 0 words or > 200 words
 *  3. Sum of all wordCounts = totalWords in meta
 *  4. Known canonical word counts match (Al-Fatiha, Al-Ikhlas, etc.)
 *  5. Longest Ayah (2:282) has ≥ 100 words
 *  6. Surah 108 (Al-Kawthar) total ≈ 9–11 words
 *  7. Total word count is in the scholarly range [77 000, 78 000]
 *
 * ═══════════════════════════════════════════════════════════════════
 * NODE VERSION REQUIREMENT
 * ═══════════════════════════════════════════════════════════════════
 * Node.js 18+ (built-in fetch; ES module support).
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import {
  normalizeArabicText,
  countArabicWords,
  validateKnownWordCounts,
} from '../src/utils/arabicTokenizer.js';

// ─── Paths ─────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_PATH = join(PROJECT_ROOT, 'public', 'quran-metadata.json');

// ─── API constants ──────────────────────────────────────────────────────────

const API_BASE = 'https://api.alquran.cloud/v1';
const EDITION = 'ar.uthmani';
const RATE_LIMIT_MS = 200;   // delay between Surah requests
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 1000;

const EXPECTED_TOTAL_AYAHS = 6236;
const SCHOLARLY_WORD_RANGE = [77_000, 78_000];

// ─── CLI argument parsing ───────────────────────────────────────────────────

const args = process.argv.slice(2);
const VALIDATE_ONLY = args.includes('--validate-only');
const OFFLINE_IDX = args.indexOf('--offline');
const OFFLINE_PATH = OFFLINE_IDX !== -1 ? resolve(args[OFFLINE_IDX + 1]) : null;

// ─── Entry point ────────────────────────────────────────────────────────────

async function main() {
  if (VALIDATE_ONLY) {
    console.log('Mode: validate-only\n');
    if (!existsSync(OUTPUT_PATH)) {
      die(`Output file not found: ${OUTPUT_PATH}\nRun without --validate-only first.`);
    }
    const existing = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'));
    runValidations(existing);
    return;
  }

  console.log('════════════════════════════════════════════════════');
  console.log(' Quran Metadata Generator — Word-Count Edition');
  console.log('════════════════════════════════════════════════════');

  const ayahMap = OFFLINE_PATH
    ? await loadFromTanzil(OFFLINE_PATH)
    : await fetchFromAPI();

  const metadata = buildMetadata(ayahMap);
  runValidations(metadata);
  writeOutput(metadata);
}

// ─── API loader ─────────────────────────────────────────────────────────────

async function fetchFromAPI() {
  console.log(`Source  : AlQuran Cloud API (${EDITION})`);
  console.log(`Output  : ${OUTPUT_PATH}`);
  console.log(`Surahs  : 114   Ayahs expected: ${EXPECTED_TOTAL_AYAHS}\n`);

  /** @type {Record<string, AyahEntry>} */
  const ayahMap = {};

  for (let surahNum = 1; surahNum <= 114; surahNum++) {
    process.stdout.write(`  Processing Surah ${String(surahNum).padStart(3, ' ')}/114 …\r`);

    const url = `${API_BASE}/surah/${surahNum}/${EDITION}`;
    const data = await fetchWithRetry(url);

    if (data.code !== 200 || !data.data?.ayahs) {
      die(`Unexpected API response for Surah ${surahNum}: ${JSON.stringify(data).slice(0, 200)}`);
    }

    for (const ayah of data.data.ayahs) {
      const key = `${surahNum}:${ayah.numberInSurah}`;
      ayahMap[key] = processAyahText(ayah.text, surahNum, ayah.numberInSurah);
    }

    if (surahNum < 114) {
      await delay(RATE_LIMIT_MS);
    }
  }

  console.log('\n');
  return ayahMap;
}

// ─── Offline (Tanzil) loader ────────────────────────────────────────────────

async function loadFromTanzil(filePath) {
  console.log(`Source  : Tanzil corpus at ${filePath}`);
  console.log(`Output  : ${OUTPUT_PATH}\n`);

  if (!existsSync(filePath)) die(`File not found: ${filePath}`);

  const lines = readFileSync(filePath, 'utf-8').split('\n');
  /** @type {Record<string, AyahEntry>} */
  const ayahMap = {};
  let lineNum = 0;

  for (const line of lines) {
    lineNum++;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue; // skip comments/blank

    const parts = trimmed.split('|');
    if (parts.length < 3) {
      console.warn(`  Line ${lineNum}: skipping malformed line: ${trimmed.slice(0, 60)}`);
      continue;
    }

    const surahNum = parseInt(parts[0], 10);
    const ayahNum = parseInt(parts[1], 10);
    const text = parts.slice(2).join('|'); // guard against | inside text

    if (isNaN(surahNum) || isNaN(ayahNum)) {
      console.warn(`  Line ${lineNum}: non-numeric surah/ayah — skipped`);
      continue;
    }

    const key = `${surahNum}:${ayahNum}`;
    ayahMap[key] = processAyahText(text, surahNum, ayahNum);
  }

  return ayahMap;
}

// ─── Core text processing ───────────────────────────────────────────────────

/**
 * @typedef {Object} AyahEntry
 * @property {number} surahId
 * @property {number} ayahNumber
 * @property {number} wordCount
 * @property {number} charCount   character count after normalization (no spaces)
 */

/**
 * Normalize raw Ayah text and compute its metrics.
 *
 * @param {string} rawText
 * @param {number} surahId
 * @param {number} ayahNumber
 * @returns {AyahEntry}
 */
function processAyahText(rawText, surahId, ayahNumber) {
  const normalized = normalizeArabicText(rawText);
  const wordCount = countArabicWords(normalized);
  const charCount = normalized.replace(/ /g, '').length;

  return { surahId, ayahNumber, wordCount, charCount };
}

// ─── Metadata assembler ──────────────────────────────────────────────────────

/**
 * Wrap the raw ayah map in the full metadata envelope.
 *
 * @param {Record<string, AyahEntry>} ayahMap
 * @returns {QuranMetadata}
 */
function buildMetadata(ayahMap) {
  const entries = Object.values(ayahMap);
  const totalAyahs = entries.length;
  const totalWords = entries.reduce((s, e) => s + e.wordCount, 0);
  const totalChars = entries.reduce((s, e) => s + e.charCount, 0);

  return {
    meta: {
      source: OFFLINE_PATH
        ? `Tanzil corpus (${OFFLINE_PATH})`
        : `AlQuran Cloud API — edition: ${EDITION}`,
      script: 'Uthmani (Medina Mushaf, Hafs narration)',
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      totalAyahs,
      totalWords,
      totalChars,
      tokenization: {
        normalization: 'NFC',
        strippedCategories: [
          'tashkeel (U+064B–U+065F, U+0670)',
          'tatweel (U+0640)',
          'waqf marks (U+06D6–U+06ED)',
          'end-of-ayah marker (U+06DD)',
          'structural marks (U+06DE, U+06E9)',
          'non-Arabic non-space residue',
        ],
        wordBoundary: 'ASCII space after normalization and whitespace collapse',
        bismillahRule:
          'Surah 1:1 IS the Bismillah (4 words counted). ' +
          'All other Surah Bismillah headers are excluded by the API (not part of any Ayah text).',
        surah9Note: 'At-Tawbah has no Bismillah.',
      },
    },
    ayahs: ayahMap,
  };
}

// ─── Validations ────────────────────────────────────────────────────────────

/**
 * @param {QuranMetadata} metadata
 */
function runValidations(metadata) {
  console.log('Running validations …');
  const errors = [];
  const warnings = [];

  const { ayahs, meta } = metadata;
  const entries = Object.entries(ayahs);

  // 1. Ayah count
  if (entries.length !== EXPECTED_TOTAL_AYAHS) {
    errors.push(
      `Ayah count: expected ${EXPECTED_TOTAL_AYAHS}, got ${entries.length}`
    );
  }

  // 2. Word count range per Ayah
  for (const [key, ayah] of entries) {
    if (ayah.wordCount < 1) {
      errors.push(`${key}: wordCount is ${ayah.wordCount} (must be ≥ 1)`);
    } else if (ayah.wordCount > 200) {
      warnings.push(`${key}: wordCount is ${ayah.wordCount} — unexpectedly high`);
    }
  }

  // 3. totalWords consistency
  const computed = entries.reduce((s, [, a]) => s + a.wordCount, 0);
  if (computed !== meta.totalWords) {
    errors.push(`totalWords mismatch: sum is ${computed}, meta says ${meta.totalWords}`);
  }

  // 4. Known canonical values
  const { passed: knownOk, failures: knownFail } = validateKnownWordCounts(ayahs);
  if (!knownOk) errors.push(...knownFail.map(f => `Canonical mismatch — ${f}`));

  // 5. Longest Ayah (2:282 — the debt Ayah, universally the longest)
  const ayah2_282 = ayahs['2:282'];
  if (!ayah2_282) {
    errors.push('2:282 missing from metadata');
  } else if (ayah2_282.wordCount < 100) {
    errors.push(`2:282 has ${ayah2_282.wordCount} words — expected ≥ 100 (it is the longest Ayah)`);
  }

  // 6. Surah 108 (Al-Kawthar) — 3 Ayahs, ~9–11 words total
  const kawtharTotal = [1, 2, 3]
    .map(a => ayahs[`108:${a}`]?.wordCount ?? 0)
    .reduce((s, n) => s + n, 0);
  if (kawtharTotal < 8 || kawtharTotal > 13) {
    warnings.push(`Surah 108 total: ${kawtharTotal} words (expected ~9–11)`);
  }

  // 7. Scholarly total word count range
  if (meta.totalWords < SCHOLARLY_WORD_RANGE[0] || meta.totalWords > SCHOLARLY_WORD_RANGE[1]) {
    errors.push(
      `Total word count ${meta.totalWords.toLocaleString()} is outside scholarly ` +
      `range [${SCHOLARLY_WORD_RANGE[0].toLocaleString()}, ${SCHOLARLY_WORD_RANGE[1].toLocaleString()}]`
    );
  }

  // ── Report ──────────────────────────────────────────────────────────────
  if (warnings.length > 0) {
    console.log('\n  Warnings:');
    warnings.forEach(w => console.log(`  ⚠  ${w}`));
  }

  if (errors.length > 0) {
    console.error('\n  Validation FAILED:');
    errors.forEach(e => console.error(`  ✗  ${e}`));
    die('Aborting — fix errors before using this metadata.');
  }

  console.log(`  ✓  ${entries.length} Ayahs`);
  console.log(`  ✓  ${meta.totalWords.toLocaleString()} total words`);
  console.log(`  ✓  Known canonical word counts match`);
  console.log(`  ✓  Longest Ayah (2:282): ${ayah2_282?.wordCount} words`);
  console.log(`  ✓  Total in scholarly range [${SCHOLARLY_WORD_RANGE.join(', ')}]`);
}

// ─── Output writer ───────────────────────────────────────────────────────────

function writeOutput(metadata) {
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(metadata, null, 2), 'utf-8');

  const sizeKB = (JSON.stringify(metadata).length / 1024).toFixed(1);

  console.log('\n════════════════════════════════════════════════════');
  console.log(` ✅  Done`);
  console.log(`     File    : ${OUTPUT_PATH}`);
  console.log(`     Size    : ${sizeKB} KB`);
  console.log(`     Ayahs   : ${metadata.meta.totalAyahs.toLocaleString()}`);
  console.log(`     Words   : ${metadata.meta.totalWords.toLocaleString()}`);
  console.log('════════════════════════════════════════════════════\n');
}

// ─── HTTP helper ─────────────────────────────────────────────────────────────

/**
 * Fetch a URL with exponential-backoff retry.
 *
 * @param {string} url
 * @returns {Promise<any>} Parsed JSON body
 */
async function fetchWithRetry(url) {
  let lastErr;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'tatabu-metadata-gen/1.0' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES - 1) {
        const wait = RETRY_BASE_MS * 2 ** attempt;
        console.warn(`\n  Retry ${attempt + 1}/${MAX_RETRIES - 1} for ${url} (${err.message}) — waiting ${wait}ms`);
        await delay(wait);
      }
    }
  }
  throw lastErr;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

const delay = ms => new Promise(r => setTimeout(r, ms));

function die(msg) {
  console.error(`\n❌ FATAL: ${msg}`);
  process.exit(1);
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('\n❌ Unhandled error:', err);
  process.exit(1);
});
