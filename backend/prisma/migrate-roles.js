/**
 * Idempotent role migration script.
 * Populates admins/teachers/students/parents tables from existing user rows.
 * Safe to run multiple times — skips already-migrated users.
 *
 * Usage: node backend/prisma/migrate-roles.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting role migration...\n');

  const users = await prisma.user.findMany({
    select: { id: true, role: true },
  });

  console.log(`Found ${users.length} total users.`);

  const grouped = { admin: [], teacher: [], student: [], parent: [] };
  for (const u of users) {
    if (grouped[u.role]) grouped[u.role].push(u.id);
    else console.warn(`  [WARN] Unknown role "${u.role}" for user ${u.id} — skipped.`);
  }

  // ── admins ──────────────────────────────────────────────────────────────────
  console.log(`\nMigrating ${grouped.admin.length} admin(s)...`);
  let adminSkipped = 0, adminCreated = 0;
  for (const userId of grouped.admin) {
    const existing = await prisma.admin.findUnique({ where: { userId } });
    if (existing) { adminSkipped++; continue; }
    await prisma.admin.create({ data: { userId } });
    adminCreated++;
  }
  console.log(`  Created: ${adminCreated} | Skipped (already migrated): ${adminSkipped}`);

  // ── teachers ─────────────────────────────────────────────────────────────────
  console.log(`\nMigrating ${grouped.teacher.length} teacher(s)...`);
  let teacherSkipped = 0, teacherCreated = 0;
  for (const userId of grouped.teacher) {
    const existing = await prisma.teacher.findUnique({ where: { userId } });
    if (existing) { teacherSkipped++; continue; }
    await prisma.teacher.create({ data: { userId } });
    teacherCreated++;
  }
  console.log(`  Created: ${teacherCreated} | Skipped (already migrated): ${teacherSkipped}`);

  // ── students ─────────────────────────────────────────────────────────────────
  console.log(`\nMigrating ${grouped.student.length} student(s)...`);
  let studentSkipped = 0, studentCreated = 0;
  for (const userId of grouped.student) {
    const existing = await prisma.student.findUnique({ where: { userId } });
    if (existing) { studentSkipped++; continue; }

    // Carry over hizbMemorized from user table
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hizbMemorized: true },
    });
    await prisma.student.create({
      data: { userId, hizbMemorized: user?.hizbMemorized ?? 0 },
    });
    studentCreated++;
  }
  console.log(`  Created: ${studentCreated} | Skipped (already migrated): ${studentSkipped}`);

  // ── parents ──────────────────────────────────────────────────────────────────
  console.log(`\nMigrating ${grouped.parent.length} parent(s)...`);
  let parentSkipped = 0, parentCreated = 0;
  for (const userId of grouped.parent) {
    const existing = await prisma.parent.findUnique({ where: { userId } });
    if (existing) { parentSkipped++; continue; }
    await prisma.parent.create({ data: { userId } });
    parentCreated++;
  }
  console.log(`  Created: ${parentCreated} | Skipped (already migrated): ${parentSkipped}`);

  // ── verification ─────────────────────────────────────────────────────────────
  console.log('\n── Verification ──────────────────────────────────────────────');
  const [adminCount, teacherCount, studentCount, parentCount] = await Promise.all([
    prisma.admin.count(),
    prisma.teacher.count(),
    prisma.student.count(),
    prisma.parent.count(),
  ]);

  console.log(`  admins   : ${adminCount} / ${grouped.admin.length}`);
  console.log(`  teachers : ${teacherCount} / ${grouped.teacher.length}`);
  console.log(`  students : ${studentCount} / ${grouped.student.length}`);
  console.log(`  parents  : ${parentCount} / ${grouped.parent.length}`);

  const mismatches = [
    adminCount !== grouped.admin.length,
    teacherCount !== grouped.teacher.length,
    studentCount !== grouped.student.length,
    parentCount !== grouped.parent.length,
  ].filter(Boolean).length;

  if (mismatches === 0) {
    console.log('\n✓ All users successfully migrated.');
  } else {
    console.error(`\n✗ ${mismatches} table(s) have a count mismatch — check for errors above.`);
    process.exit(1);
  }
}

migrate()
  .catch(err => { console.error('Migration failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
