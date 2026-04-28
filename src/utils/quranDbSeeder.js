
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { QURAN_TEXT } from './quranText.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const DB_PATH   = process.argv[2] ?? resolve(__dir, '../../quran.db');
const SCHEMA_SQL = resolve(__dir, '../../schema.sql');

// ---------------------------------------------------------------------------
// Arabic text processing functions
// ---------------------------------------------------------------------------

// Remove diacritics (tashkeel) from Arabic text
function removeDiacritics(text) {
  // Remove Arabic diacritics (combining marks)
  return text.normalize('NFD').replace(/[\u064B-\u065F\u0670\u0674-\u0678\u06D6-\u06ED]/g, '').normalize('NFC');
}

// Count Arabic letters only (ء to ي)
function countArabicLetters(text) {
  const arabicLetters = /[\u0621-\u064A]/g;
  const matches = text.match(arabicLetters);
  return matches ? matches.length : 0;
}

// ---------------------------------------------------------------------------
// Surah data (114 rows)
// ---------------------------------------------------------------------------
const SURAHS = [
  [1,'الفاتحة','Al-Fatiha',7,'Meccan'],
  [2,'البقرة','Al-Baqarah',286,'Medinan'],
  [3,'آل عمران',"Al-'Imran",200,'Medinan'],
  [4,'النساء',"An-Nisa'",176,'Medinan'],
  [5,'المائدة',"Al-Ma'idah",120,'Medinan'],
  [6,'الأنعام',"Al-An'am",165,'Meccan'],
  [7,'الأعراف',"Al-A'raf",206,'Meccan'],
  [8,'الأنفال','Al-Anfal',75,'Medinan'],
  [9,'التوبة','At-Tawbah',129,'Medinan'],
  [10,'يونس','Yunus',109,'Meccan'],
  [11,'هود','Hud',123,'Meccan'],
  [12,'يوسف','Yusuf',111,'Meccan'],
  [13,'الرعد',"Ar-Ra'd",43,'Medinan'],
  [14,'إبراهيم','Ibrahim',52,'Meccan'],
  [15,'الحجر','Al-Hijr',99,'Meccan'],
  [16,'النحل','An-Nahl',128,'Meccan'],
  [17,'الإسراء',"Al-Isra'",111,'Meccan'],
  [18,'الكهف','Al-Kahf',110,'Meccan'],
  [19,'مريم','Maryam',98,'Meccan'],
  [20,'طه','Ta-Ha',135,'Meccan'],
  [21,'الأنبياء',"Al-Anbiya'",112,'Meccan'],
  [22,'الحج','Al-Hajj',78,'Medinan'],
  [23,'المؤمنون',"Al-Mu'minun",118,'Meccan'],
  [24,'النور','An-Nur',64,'Medinan'],
  [25,'الفرقان','Al-Furqan',77,'Meccan'],
  [26,'الشعراء',"Ash-Shu'ara'",227,'Meccan'],
  [27,'النمل','An-Naml',93,'Meccan'],
  [28,'القصص','Al-Qasas',88,'Meccan'],
  [29,'العنكبوت','Al-Ankabut',69,'Meccan'],
  [30,'الروم','Ar-Rum',60,'Meccan'],
  [31,'لقمان','Luqman',34,'Meccan'],
  [32,'السجدة','As-Sajdah',30,'Meccan'],
  [33,'الأحزاب','Al-Ahzab',73,'Medinan'],
  [34,'سبأ','Saba',54,'Meccan'],
  [35,'فاطر','Fatir',45,'Meccan'],
  [36,'يس','Ya-Sin',83,'Meccan'],
  [37,'الصافات','As-Saffat',182,'Meccan'],
  [38,'ص','Sad',88,'Meccan'],
  [39,'الزمر','Az-Zumar',75,'Meccan'],
  [40,'غافر','Ghafir',85,'Meccan'],
  [41,'فصلت','Fussilat',54,'Meccan'],
  [42,'الشورى','Ash-Shura',53,'Meccan'],
  [43,'الزخرف','Az-Zukhruf',89,'Meccan'],
  [44,'الدخان','Ad-Dukhan',59,'Meccan'],
  [45,'الجاثية','Al-Jathiyah',37,'Meccan'],
  [46,'الأحقاف','Al-Ahqaf',35,'Meccan'],
  [47,'محمد','Muhammad',38,'Medinan'],
  [48,'الفتح','Al-Fath',29,'Medinan'],
  [49,'الحجرات','Al-Hujurat',18,'Medinan'],
  [50,'ق','Qaf',45,'Meccan'],
  [51,'الذاريات','Adh-Dhariyat',60,'Meccan'],
  [52,'الطور','At-Tur',49,'Meccan'],
  [53,'النجم','An-Najm',62,'Meccan'],
  [54,'القمر','Al-Qamar',55,'Meccan'],
  [55,'الرحمن','Ar-Rahman',78,'Medinan'],
  [56,'الواقعة',"Al-Waqi'ah",96,'Meccan'],
  [57,'الحديد','Al-Hadid',29,'Medinan'],
  [58,'المجادلة','Al-Mujadila',22,'Medinan'],
  [59,'الحشر','Al-Hashr',24,'Medinan'],
  [60,'الممتحنة','Al-Mumtahanah',13,'Medinan'],
  [61,'الصف','As-Saf',14,'Medinan'],
  [62,'الجمعة',"Al-Jumu'ah",11,'Medinan'],
  [63,'المنافقون','Al-Munafiqun',11,'Medinan'],
  [64,'التغابن','At-Taghabun',18,'Medinan'],
  [65,'الطلاق','At-Talaq',12,'Medinan'],
  [66,'التحريم','At-Tahrim',12,'Medinan'],
  [67,'الملك','Al-Mulk',30,'Meccan'],
  [68,'القلم','Al-Qalam',52,'Meccan'],
  [69,'الحاقة','Al-Haqqah',52,'Meccan'],
  [70,'المعارج',"Al-Ma'arij",44,'Meccan'],
  [71,'نوح','Nuh',28,'Meccan'],
  [72,'الجن','Al-Jinn',28,'Meccan'],
  [73,'المزمل','Al-Muzzammil',20,'Meccan'],
  [74,'المدثر','Al-Muddaththir',56,'Meccan'],
  [75,'القيامة','Al-Qiyamah',40,'Meccan'],
  [76,'الإنسان','Al-Insan',31,'Medinan'],
  [77,'المرسلات','Al-Mursalat',50,'Meccan'],
  [78,'النبأ',"An-Naba'",40,'Meccan'],
  [79,'النازعات',"An-Nazi'at",46,'Meccan'],
  [80,'عبس','Abasa',42,'Meccan'],
  [81,'التكوير','At-Takwir',29,'Meccan'],
  [82,'الانفطار','Al-Infitar',19,'Meccan'],
  [83,'المطففين','Al-Mutaffifin',36,'Meccan'],
  [84,'الانشقاق','Al-Inshiqaq',25,'Meccan'],
  [85,'البروج','Al-Buruj',22,'Meccan'],
  [86,'الطارق','At-Tariq',17,'Meccan'],
  [87,'الأعلى',"Al-A'la",19,'Meccan'],
  [88,'الغاشية','Al-Ghashiyah',26,'Meccan'],
  [89,'الفجر','Al-Fajr',30,'Meccan'],
  [90,'البلد','Al-Balad',20,'Meccan'],
  [91,'الشمس','Ash-Shams',15,'Meccan'],
  [92,'الليل','Al-Layl',21,'Meccan'],
  [93,'الضحى','Ad-Duha',11,'Meccan'],
  [94,'الشرح','Ash-Sharh',8,'Meccan'],
  [95,'التين','At-Tin',8,'Meccan'],
  [96,'العلق','Al-Alaq',19,'Meccan'],
  [97,'القدر','Al-Qadr',5,'Meccan'],
  [98,'البينة','Al-Bayyinah',8,'Medinan'],
  [99,'الزلزلة','Az-Zalzalah',8,'Medinan'],
  [100,'العاديات','Al-Adiyat',11,'Meccan'],
  [101,'القارعة',"Al-Qari'ah",11,'Meccan'],
  [102,'التكاثر','At-Takathur',8,'Meccan'],
  [103,'العصر','Al-Asr',3,'Meccan'],
  [104,'الهمزة','Al-Humazah',9,'Meccan'],
  [105,'الفيل','Al-Fil',5,'Meccan'],
  [106,'قريش','Quraysh',4,'Meccan'],
  [107,'الماعون',"Al-Ma'un",7,'Meccan'],
  [108,'الكوثر','Al-Kawthar',3,'Meccan'],
  [109,'الكافرون','Al-Kafirun',6,'Meccan'],
  [110,'النصر','An-Nasr',3,'Medinan'],
  [111,'المسد','Al-Masad',5,'Meccan'],
  [112,'الإخلاص','Al-Ikhlas',4,'Meccan'],
  [113,'الفلق','Al-Falaq',5,'Meccan'],
  [114,'الناس','An-Nas',6,'Meccan'],
];

// Hizb boundaries — same as quranHizb.js (must stay in sync)
const HIZB_BOUNDARIES = [
  [1,1,1,1,2,74],[2,1,2,75,2,141],
  [3,2,2,142,2,202],[4,2,2,203,2,252],
  [5,3,2,253,3,14],[6,3,3,15,3,92],
  [7,4,3,93,3,170],[8,4,3,171,4,23],
  [9,5,4,24,4,87],[10,5,4,88,4,147],
  [11,6,4,148,5,26],[12,6,5,27,5,81],
  [13,7,5,82,6,35],[14,7,6,36,6,110],
  [15,8,6,111,7,16],[16,8,7,17,7,87],
  [17,9,7,88,7,167],[18,9,7,168,8,40],
  [19,10,8,41,9,27],[20,10,9,28,9,92],
  [21,11,9,93,10,37],[22,11,10,38,11,5],
  [23,12,11,6,11,83],[24,12,11,84,12,52],
  [25,13,12,53,13,18],[26,13,13,19,14,52],
  [27,14,15,1,16,50],[28,14,16,51,16,128],
  [29,15,17,1,17,98],[30,15,17,99,18,74],
  [31,16,18,75,19,98],[32,16,20,1,20,135],
  [33,17,21,1,21,77],[34,17,21,78,22,78],
  [35,18,23,1,23,100],[36,18,23,101,25,20],
  [37,19,25,21,26,110],[38,19,26,111,27,55],
  [39,20,27,56,28,50],[40,20,28,51,29,45],
  [41,21,29,46,31,21],[42,21,31,22,33,30],
  [43,22,33,31,34,23],[44,22,34,24,36,27],
  [45,23,36,28,37,144],[46,23,37,145,39,31],
  [47,24,39,32,40,40],[48,24,40,41,41,46],
  [49,25,41,47,43,23],[50,25,43,24,45,37],
  [51,26,46,1,48,17],[52,26,48,18,51,30],
  [53,27,51,31,54,55],[54,27,55,1,57,29],
  [55,28,58,1,61,14],[56,28,62,1,66,12],
  [57,29,67,1,71,28],[58,29,72,1,77,50],
  [59,30,78,1,86,17],[60,30,87,1,114,6],
];

// Build surah offsets
const surahCounts = SURAHS.map(r => r[3]);
const surahOffsets = [null]; // 1-based
surahOffsets[1] = 1;
for (let s = 2; s <= 114; s++) surahOffsets[s] = surahOffsets[s-1] + surahCounts[s-2];
const gIdx = (surah, ayah) => surahOffsets[surah] + ayah - 1;

// ──────────────────────────────────────────────────────────────────────────────
function seed() {
  const db = new Database(DB_PATH);
  const schema = readFileSync(SCHEMA_SQL, 'utf8');

  // Only run the DDL portion (skip the sample INSERT block)
  const ddl = schema.split('-- ---------------------------------------------------------------------------\n-- SAMPLE SEED DATA')[0];
  db.exec(ddl);

  console.log(`📦 Seeding ${DB_PATH} …`);

  db.transaction(() => {
    // 1 — Surahs
    const insSurah = db.prepare(
      'INSERT OR IGNORE INTO surahs VALUES (?,?,?,?,?)'
    );
    for (const s of SURAHS) insSurah.run(...s);
    console.log('  ✅ 114 surahs inserted');

    // 2 — Hizb boundaries
    const insHizb = db.prepare(
      'INSERT OR IGNORE INTO hizb_boundaries VALUES (?,?,?,?,?,?,?)'
    );
    for (const [hizb, juz, ss, sa, es, ea] of HIZB_BOUNDARIES) {
      const count = gIdx(es, ea) - gIdx(ss, sa) + 1;
      insHizb.run(hizb, juz, ss, sa, es, ea, count);
    }
    console.log('  ✅ 60 Hizb boundaries inserted');

    // 3 — Build verse rows with character counts and fractions
    const verseData = [];
    let totalChars = 0;
    for (let s = 1; s <= 1; s++) {  // Only Al-Fatiha for now
      const ayahCount = surahCounts[s-1];
      for (let a = 1; a <= ayahCount; a++) {
        const text = QURAN_TEXT[s-1][a-1];
        if (!text) {
          console.error(`Missing text for ${s}:${a}`);
          continue;
        }
        const cleanText = removeDiacritics(text);
        const charCount = countArabicLetters(cleanText);
        verseData.push({ surah: s, ayah: a, text, cleanText, charCount });
        totalChars += charCount;
      }
    }
    console.log(`  📊 Processed ${verseData.length} verses, total characters: ${totalChars}`);

    // Insert verses with fractions
    const insVerse = db.prepare(`
      INSERT OR IGNORE INTO verses
        (surah_id, ayah_number, text, clean_text, char_count, quran_fraction)
      VALUES (?,?,?,?,?,?)
    `);
    for (const v of verseData) {
      const fraction = v.charCount / totalChars;
      insVerse.run(v.surah, v.ayah, v.text, v.cleanText, v.charCount, fraction);
    }
    console.log(`  ✅ ${verseData.length} verse rows inserted`);
  })();

  // 4 — Integrity check
  const fractionSum = db.prepare(`
    SELECT SUM(quran_fraction) AS total
    FROM verses
  `).get().total;
  if (Math.abs(fractionSum - 1.0) < 1e-9) {
    console.log('  ✅ Sum of quran_fraction = exactly 1.0');
  } else {
    console.error(`  ❌ Sum of quran_fraction = ${fractionSum}, expected 1.0`);
  }

  const totalCharsDb = db.prepare(`
    SELECT SUM(char_count) AS total
    FROM verses
  `).get().total;
  console.log(`  📊 Total characters in database: ${totalCharsDb}`);

  // 5 — Demo query: Al-Fatiha 1:1 → 1:7
  const { memorized_fraction } = db.prepare(`
    SELECT SUM(quran_fraction) AS memorized_fraction
    FROM verses
    WHERE surah_id = ? AND ayah_number BETWEEN ? AND ?
  `).get(1, 1, 7);

  console.log(`\n  Demo: Al-Fatiha 1:1 → 1:7 = ${memorized_fraction.toFixed(6)} Quran fraction`);
  console.log(`        Converted to Hizb: ${(memorized_fraction * 60).toFixed(4)} Hizb`);
  console.log('\n✅ Seeding complete.');

  db.close();
}

seed();
