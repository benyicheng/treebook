require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('@prisma/client');
// Override DATABASE_URL to point to the correct location
process.env.DATABASE_URL = 'file:' + require('path').resolve(__dirname, '..', 'prisma', 'dev.db');
console.log('Starting with DATABASE_URL:', process.env.DATABASE_URL);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'MISSING');

// We need to use tsx to run the TypeScript entry point
const { spawn } = require('child_process');
const child = spawn('npx.cmd', ['tsx', 'src/index.ts'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env }
});
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);
