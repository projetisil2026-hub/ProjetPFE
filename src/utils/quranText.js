// quranText.js — Quran verses in Uthmani script (Tanzil.net)
// Full text for all 6236 verses.
// Format: QURAN_TEXT[surah-1][ayah-1] = "text"
//
// To get the full text:
// 1. Download from https://tanzil.net/download/
// 2. Select "Uthmani" text, "Simple Enhanced" format
// 3. Parse the text file and populate the array
//
// For now, only Al-Fatiha is included as an example.

export const QURAN_TEXT = [
  // Surah 1: Al-Fatiha
  [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    "الرَّحْمَٰنِ الرَّحِيمِ",
    "مَالِكِ يَوْمِ الدِّينِ",
    "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ"
  ],
  // Add the rest of the surahs here...
  // Each surah is an array of strings, one per ayah.
];