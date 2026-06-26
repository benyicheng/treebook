/**
 * Master seed — runs all three seed scripts in sequence.
 * Usage: npx tsx prisma/seed_all.ts
 * Database URL: file:./dev.db (from .env)
 */
import { execSync } from 'child_process';

async function main() {
  const scripts = [
    { name: 'Base seed (full)', file: 'prisma/seed_full.ts' },
    { name: 'Test data (extra stories, users)', file: 'prisma/seed_test_data.ts' },
    { name: 'Rich content (detailed chapters, cross-feature data)', file: 'prisma/seed_rich_content.ts' },
  ];

  for (const s of scripts) {
    console.log(`\n========== Running: ${s.name} ==========`);
    execSync(`npx tsx ${s.file}`, { stdio: 'inherit', cwd: process.cwd() });
  }

  console.log('\n========== ALL SEEDS COMPLETE ==========');
}

main().catch(e => { console.error(e); process.exit(1); });
