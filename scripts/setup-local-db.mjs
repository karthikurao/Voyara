import { execSync } from 'node:child_process';

function canRun(command) {
  try {
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function bootstrapLocalMongo() {
  if (!canRun('docker --version')) {
    console.warn('[postinstall] Docker not found. Skipping local MongoDB bootstrap.');
    return;
  }

  if (!canRun('docker compose version')) {
    console.warn('[postinstall] Docker Compose not found. Skipping local MongoDB bootstrap.');
    return;
  }

  try {
    execSync('docker compose up -d mongodb', { stdio: 'inherit' });
    console.log('[postinstall] Local MongoDB is ready at mongodb://127.0.0.1:27017/voyara');
  } catch {
    console.warn('[postinstall] Failed to auto-start local MongoDB. Run `npm run db:up` manually.');
  }
}

bootstrapLocalMongo();
