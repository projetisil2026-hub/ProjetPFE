/**
 * memorizationService.js — Backend business logic for memorization progress.
 *
 * ═══════════════════════════════════════════════════════════════════
 * ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════
 *
 * This service sits between the HTTP controller and the database.
 * It owns:
 *   1. Progress calculation (word-count-weighted, same algorithm as frontend)
 *   2. In-process LRU cache with TTL (avoids recomputing on every request)
 *   3. Cache invalidation on any write (create / update / delete)
 *   4. Batch progress for class-wide teacher dashboards
 *
 * ═══════════════════════════════════════════════════════════════════
 * CACHING STRATEGY
 * ═══════════════════════════════════════════════════════════════════
 *
 * Implementation: Map-based LRU with TTL
 *   • In-process — no Redis dependency needed at this scale.
 *   • LRU eviction keeps memory bounded (MAX_CACHE_SIZE entries).
 *   • TTL of 30 minutes ensures stale reads are bounded even if a
 *     cache-invalidation event is missed.
 *   • Cache key: studentId[:academicYearId] — scoped by year if provided.
 *
 * Trade-off vs Redis:
 *   • Pro: zero infrastructure cost, zero latency, simpler ops.
 *   • Con: cache does not survive process restart; each Node.js worker
 *     in a cluster has its own cache (no shared invalidation).
 *   • Mitigation: TTL is short (30 min); progress accuracy is
 *     eventually consistent within one TTL window.
 *   • Upgrade path: replace ProgressCache with a Redis adapter that
 *     exposes the same get/set/invalidate interface.
 *
 * ═══════════════════════════════════════════════════════════════════
 * RECOMPUTATION STRATEGY
 * ═══════════════════════════════════════════════════════════════════
 *
 * Full recompute on cache miss:
 *   • Fetch all memorization records for the student from the DB.
 *   • Run the same deduplication + word-count algorithm.
 *   • O(R × W) where R = number of records and W = average range width.
 *     For a typical student: R < 500, W < 10 → < 5 000 operations.
 *
 * Incremental update on CREATE (optimization):
 *   • When a new record is created, we already know the previous state
 *     from the cache. We extend the ayahMap with only the new words,
 *     avoiding a DB round-trip for a fast-path update.
 *   • Not available for UPDATE or DELETE — those require full recompute
 *     because we cannot undo previously counted Ayahs without replaying
 *     the full record set.
 *
 * ═══════════════════════════════════════════════════════════════════
 * ESM / CJS BRIDGE
 * ═══════════════════════════════════════════════════════════════════
 *
 * The frontend utilities (weightedProgress.js, quranMetadata.js) are
 * ES modules. This backend service is CommonJS (the backend package.json
 * has no "type": "module"). We bridge via dynamic import(), which is
 * available in Node.js 12+ from CJS context. The Promise is cached so
 * the import runs exactly once per process lifetime.
 *
 * quran-metadata.json is loaded directly via require() on the backend —
 * faster than fetch(), works offline, no CORS concerns.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');

// ─── Metadata (loaded once at module init) ───────────────────────────────────

const METADATA_PATH = path.resolve(__dirname, '../../../../public/quran-metadata.json');

/** @type {{ meta: Object, ayahs: Record<string, {wordCount: number}> } | null} */
let _metadata = null;

function loadMetadata() {
  if (_metadata) return _metadata;

  if (!fs.existsSync(METADATA_PATH)) {
    throw new Error(
      `Quran metadata not found at ${METADATA_PATH}. ` +
      'Run: node scripts/generate-quran-metadata.js'
    );
  }

  try {
    _metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
  } catch (err) {
    throw new Error(`Failed to parse quran-metadata.json: ${err.message}`);
  }

  return _metadata;
}

// ─── Hizb-boundary engine (CJS mirror of quranHizb.js) ──────────────────────
// Duplicated in CJS to avoid ESM/CJS interop. Hizb 33/34 corrected to match
// the King Fahd Complex (Medina Mushaf): boundary falls at 22:1, making
// Al-Anbiya (21:1-112) = Hizb 33 and Al-Hajj (22:1-78) = Hizb 34.

const _SURAH_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,
  123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,
  34,30,73,54,45,83,182,88,75,85,
  54,53,89,59,37,35,38,29,18,45,
  60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,
  28,28,20,56,40,31,50,40,46,42,
  29,19,36,25,22,17,19,26,30,20,
  15,21,11,8,8,19,5,8,8,11,
  11,8,3,9,5,4,7,3,6,3,
  5,4,5,6,
];

const _SURAH_OFFSETS = (() => {
  const o = new Array(115);
  o[1] = 1;
  for (let s = 2; s <= 114; s++) o[s] = o[s - 1] + _SURAH_COUNTS[s - 2];
  return o;
})();

const _globalIndex = (s, a) => _SURAH_OFFSETS[s] + a - 1;

// Corrected Hizb boundaries (King Fahd Complex / Medina Mushaf).
// Each row: [hizbNumber, startSurah, startAyah, endSurah, endAyah]
const _HIZB_BOUNDARIES = [
  [1,1,1,2,74],[2,2,75,2,141],
  [3,2,142,2,202],[4,2,203,2,252],
  [5,2,253,3,14],[6,3,15,3,92],
  [7,3,93,3,170],[8,3,171,4,23],
  [9,4,24,4,87],[10,4,88,4,147],
  [11,4,148,5,26],[12,5,27,5,81],
  [13,5,82,6,35],[14,6,36,6,110],
  [15,6,111,7,16],[16,7,17,7,87],
  [17,7,88,7,167],[18,7,168,8,40],
  [19,8,41,9,27],[20,9,28,9,92],
  [21,9,93,10,37],[22,10,38,11,5],
  [23,11,6,11,83],[24,11,84,12,52],
  [25,12,53,13,18],[26,13,19,14,52],
  [27,15,1,16,50],[28,16,51,16,128],
  [29,17,1,17,98],[30,17,99,18,74],
  [31,18,75,19,98],[32,20,1,20,135],
  // Juz 17 — boundary at 22:1 (Al-Hajj start), confirmed Medina Mushaf
  [33,21,1,21,112],[34,22,1,22,78],
  [35,23,1,23,100],[36,23,101,25,20],
  [37,25,21,26,110],[38,26,111,27,55],
  [39,27,56,28,50],[40,28,51,29,45],
  [41,29,46,31,21],[42,31,22,33,30],
  [43,33,31,34,23],[44,34,24,36,27],
  [45,36,28,37,144],[46,37,145,39,31],
  [47,39,32,40,40],[48,40,41,41,46],
  [49,41,47,43,23],[50,43,24,45,37],
  [51,46,1,48,17],[52,48,18,51,30],
  [53,51,31,54,55],[54,55,1,57,29],
  [55,58,1,61,14],[56,62,1,66,12],
  [57,67,1,71,28],[58,72,1,77,50],
  [59,78,1,86,17],[60,87,1,114,6],
];

// Build verse → {fractionValue, cumulativeHizb} table (runs once at module load)
const _VERSE_TABLE = (() => {
  const TOTAL = 6236;
  const table = new Array(TOTAL);

  for (const [hizb, ss, sa, es, ea] of _HIZB_BOUNDARIES) {
    const gStart = _globalIndex(ss, sa);
    const gEnd   = _globalIndex(es, ea);
    const weight = 1 / (gEnd - gStart + 1);
    for (let g = gStart; g <= gEnd; g++) {
      table[g - 1] = { hizbNumber: hizb, fractionValue: weight, cumulativeHizb: 0 };
    }
  }

  let cum = 0;
  for (let i = 0; i < TOTAL; i++) {
    table[i].cumulativeHizb = cum;
    cum += table[i].fractionValue;
  }
  return table;
})();

/**
 * Compute total fractional Hizb progress from memorization records.
 * Deduplicates overlapping ranges. Mirrors calcTotalHizbFromRecords from quranHizb.js.
 *
 * @param {Array<{surahId:number, fromAyah:number, toAyah:number}>} records
 * @returns {number} Hizb progress in [0, 60]
 */
function _calcHizbFromRecords(records) {
  const covered = new Set();
  for (const r of records) {
    const gs = _globalIndex(r.surahId, r.fromAyah);
    const ge = _globalIndex(r.surahId, r.toAyah);
    for (let g = gs; g <= ge; g++) covered.add(g);
  }
  let total = 0;
  for (const g of covered) {
    if (_VERSE_TABLE[g - 1]) total += _VERSE_TABLE[g - 1].fractionValue;
  }
  return Math.min(total, 60);
}

// ─── Core progress engine (CJS) ──────────────────────────────────────────────

const REJECTED_EVALUATIONS = new Set(['repeat']);
const COUNTED_EVALUATIONS = new Set(['excellent', 'good', 'average']);

/**
 * Compute progress from an array of memorization records.
 * - percentage / wordsMemorized: word-count weighted (accurate coverage)
 * - hizbProgress / juzProgress: Hizb-boundary based (matches Medina Mushaf)
 *
 * @param {Array<{surahId:number, fromAyah:number, toAyah:number, evaluation:string}>} records
 * @returns {{ result: ProgressResult, ayahMap: Map<string,number> }}
 */
function computeProgress(records) {
  const meta = loadMetadata();
  const { ayahs, meta: { totalWords: totalQuranWords } } = meta;

  /** @type {Map<string, number>} */
  const ayahMap = new Map();
  // Valid, non-repeat records for the Hizb calculation
  const hizbRecs = [];
  const warnings = [];
  let skipped = 0;

  for (const rec of records) {
    if (!rec || typeof rec !== 'object') { skipped++; continue; }

    const { surahId, fromAyah, toAyah, evaluation, id } = rec;

    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
      warnings.push(`Record ${id ?? '?'}: invalid surahId ${surahId}`);
      skipped++;
      continue;
    }
    if (!Number.isInteger(fromAyah) || fromAyah < 1) {
      warnings.push(`Record ${id ?? '?'}: invalid fromAyah ${fromAyah}`);
      skipped++;
      continue;
    }
    if (!Number.isInteger(toAyah) || toAyah < fromAyah) {
      warnings.push(`Record ${id ?? '?'}: toAyah ${toAyah} < fromAyah`);
      skipped++;
      continue;
    }
    if (REJECTED_EVALUATIONS.has(evaluation)) { skipped++; continue; }
    if (!COUNTED_EVALUATIONS.has(evaluation)) {
      warnings.push(`Record ${id ?? '?'}: unknown evaluation "${evaluation}" — counted`);
    }

    hizbRecs.push({ surahId, fromAyah, toAyah });

    for (let a = fromAyah; a <= toAyah; a++) {
      const key = `${surahId}:${a}`;
      if (ayahMap.has(key)) continue;
      const ayahMeta = ayahs[key];
      if (!ayahMeta) { warnings.push(`Ayah ${key} not found in metadata — skipped`); continue; }
      ayahMap.set(key, ayahMeta.wordCount);
    }
  }

  let memorizedWords = 0;
  for (const wc of ayahMap.values()) memorizedWords += wc;

  const ratio = totalQuranWords > 0 ? Math.min(memorizedWords / totalQuranWords, 1) : 0;

  // Hizb/Juz use the boundary-based system, NOT word-count × 60
  const hizbProgress = _calcHizbFromRecords(hizbRecs);

  const result = {
    memorizedWords,
    totalQuranWords,
    ratio,
    percentage: ratio * 100,
    hizbProgress,
    juzProgress: hizbProgress / 2,
    ayahsMemorized: ayahMap.size,
    recordsProcessed: records.length,
    recordsSkipped: skipped,
    warnings,
  };

  return { result, ayahMap };
}

// ─── LRU Cache ───────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 500;

class ProgressCache {
  constructor() {
    /** @type {Map<string, { result: Object, ayahMap: Map, expiresAt: number }>} */
    this._store = new Map();
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return null;
    }
    // Refresh LRU position
    this._store.delete(key);
    this._store.set(key, entry);
    return entry;
  }

  set(key, result, ayahMap) {
    if (this._store.size >= MAX_CACHE_SIZE && !this._store.has(key)) {
      // Evict oldest (first inserted in Map iteration order)
      const oldest = this._store.keys().next().value;
      this._store.delete(oldest);
    }
    this._store.set(key, {
      result,
      ayahMap,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  invalidate(key) {
    this._store.delete(key);
  }

  invalidatePattern(studentId) {
    // Invalidate all keys for this student (with and without year suffix)
    for (const key of this._store.keys()) {
      if (key === studentId || key.startsWith(`${studentId}:`)) {
        this._store.delete(key);
      }
    }
  }

  clear() {
    this._store.clear();
  }

  get size() {
    return this._store.size;
  }
}

const cache = new ProgressCache();

// ─── Cache key helpers ────────────────────────────────────────────────────────

function cacheKey(studentId, academicYearId) {
  return academicYearId ? `${studentId}:${academicYearId}` : studentId;
}

// ─── Normalize DB record ──────────────────────────────────────────────────────

function normalizeRecord(r) {
  return {
    id: r.id,
    surahId: Number(r.surahId),
    fromAyah: Number(r.fromAyah),
    toAyah: Number(r.toAyah),
    evaluation: r.evaluation,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get weighted progress for a student.
 * Returns cached result if available; recomputes from DB on miss.
 *
 * @param {string} studentId
 * @param {string} [academicYearId]
 * @returns {Promise<ProgressResult>}
 */
async function getStudentProgress(studentId, academicYearId) {
  const key = cacheKey(studentId, academicYearId);
  const cached = cache.get(key);
  if (cached) return cached.result;

  return _recomputeAndCache(studentId, academicYearId, key);
}

/**
 * Force-recompute progress from the database, bypassing cache.
 * Use after update or delete operations.
 *
 * @param {string} studentId
 * @param {string} [academicYearId]
 * @returns {Promise<ProgressResult>}
 */
async function recomputeProgress(studentId, academicYearId) {
  const key = cacheKey(studentId, academicYearId);
  cache.invalidate(key);
  return _recomputeAndCache(studentId, academicYearId, key);
}

/**
 * Invalidate all cached progress entries for a student.
 * Call after any write operation (create / update / delete).
 *
 * @param {string} studentId
 */
function invalidateStudentCache(studentId) {
  cache.invalidatePattern(studentId);
}

/**
 * Fast-path update: add one new record to an existing cached result.
 * Falls back to full recompute if no cache entry exists.
 *
 * Only correct for CREATE operations. For UPDATE/DELETE call
 * recomputeProgress() instead.
 *
 * @param {string} studentId
 * @param {string} [academicYearId]
 * @param {Object} newRecord  Newly created DB record
 * @returns {Promise<ProgressResult>}
 */
async function applyNewRecord(studentId, academicYearId, newRecord) {
  const key = cacheKey(studentId, academicYearId);
  const cached = cache.get(key);

  if (!cached) {
    return _recomputeAndCache(studentId, academicYearId, key);
  }

  const normalized = normalizeRecord(newRecord);
  const meta = loadMetadata();
  const { ayahs, meta: { totalWords } } = meta;

  const updatedMap = new Map(cached.ayahMap);
  const warnings = [...cached.result.warnings];

  if (!REJECTED_EVALUATIONS.has(normalized.evaluation)) {
    for (let a = normalized.fromAyah; a <= normalized.toAyah; a++) {
      const k = `${normalized.surahId}:${a}`;
      if (updatedMap.has(k)) continue;
      const ayahMeta = ayahs[k];
      if (!ayahMeta) continue;
      updatedMap.set(k, ayahMeta.wordCount);
    }
  }

  let memorizedWords = 0;
  for (const wc of updatedMap.values()) memorizedWords += wc;

  const ratio = Math.min(memorizedWords / totalWords, 1);

  // Recompute Hizb from the accumulated ayahMap (each key = one Ayah)
  const hizbRecs = [];
  for (const key of updatedMap.keys()) {
    const [s, a] = key.split(':').map(Number);
    hizbRecs.push({ surahId: s, fromAyah: a, toAyah: a });
  }
  const hizbProgress = _calcHizbFromRecords(hizbRecs);

  const result = {
    memorizedWords,
    totalQuranWords: totalWords,
    ratio,
    percentage: ratio * 100,
    hizbProgress,
    juzProgress: hizbProgress / 2,
    ayahsMemorized: updatedMap.size,
    recordsProcessed: cached.result.recordsProcessed + 1,
    recordsSkipped: cached.result.recordsSkipped,
    warnings,
  };

  cache.set(key, result, updatedMap);
  return result;
}

/**
 * Compute progress for multiple students in a single DB query.
 * Designed for the teacher dashboard class-wide view.
 *
 * @param {string[]} studentIds
 * @param {string}   [academicYearId]
 * @returns {Promise<Map<string, ProgressResult>>}
 */
async function getBatchProgress(studentIds, academicYearId) {
  if (!studentIds.length) return new Map();

  // Serve from cache where possible
  const results = new Map();
  const needFetch = [];

  for (const sid of studentIds) {
    const key = cacheKey(sid, academicYearId);
    const cached = cache.get(key);
    if (cached) {
      results.set(sid, cached.result);
    } else {
      needFetch.push(sid);
    }
  }

  if (needFetch.length === 0) return results;

  // Single DB query for all uncached students
  const where = {
    studentId: { in: needFetch },
    ...(academicYearId ? { academicYearId } : {}),
  };

  const allRecords = await prisma.memorization.findMany({ where });

  // Group by student
  /** @type {Map<string, Object[]>} */
  const byStudent = new Map();
  for (const r of allRecords) {
    if (!byStudent.has(r.studentId)) byStudent.set(r.studentId, []);
    byStudent.get(r.studentId).push(r);
  }

  // Compute and cache each student
  for (const sid of needFetch) {
    const dbRecords = (byStudent.get(sid) ?? []).map(normalizeRecord);
    const { result, ayahMap } = computeProgress(dbRecords);

    const key = cacheKey(sid, academicYearId);
    cache.set(key, result, ayahMap);
    results.set(sid, result);
  }

  return results;
}

/**
 * Format a progress result into a lean API response object.
 *
 * @param {ProgressResult} result
 * @returns {Object}
 */
function formatProgressResponse(result) {
  return {
    percentage: parseFloat(result.percentage.toFixed(4)),
    hizb: parseFloat(result.hizbProgress.toFixed(4)),
    juz: parseFloat(result.juzProgress.toFixed(4)),
    memorizedWords: result.memorizedWords,
    totalWords: result.totalQuranWords,
    ayahsMemorized: result.ayahsMemorized,
    hasWarnings: result.warnings.length > 0,
    ...(process.env.NODE_ENV !== 'production' && result.warnings.length > 0
      ? { warnings: result.warnings }
      : {}),
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function _recomputeAndCache(studentId, academicYearId, key) {
  const where = {
    studentId,
    ...(academicYearId ? { academicYearId } : {}),
  };

  const dbRecords = await prisma.memorization.findMany({ where });
  const records = dbRecords.map(normalizeRecord);
  const { result, ayahMap } = computeProgress(records);

  cache.set(key, result, ayahMap);
  return result;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getStudentProgress,
  recomputeProgress,
  invalidateStudentCache,
  applyNewRecord,
  getBatchProgress,
  formatProgressResponse,
  // Expose for testing
  _computeProgress: computeProgress,
  _cache: cache,
};
