// scripts/prepare-prisma.js
// Automatically aligns prisma/schema.prisma datasource provider with DATABASE_URL
// Supports: PostgreSQL (production/server) and SQLite (local development)

const fs = require('fs');
const path = require('path');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.trim();
  }

  const rootDir = path.resolve(__dirname, '..');
  const envFiles = ['.env.local', '.env.production', '.env'];

  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const match = content.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
        if (match && match[1]) {
          return match[1].trim();
        }
      } catch (e) {}
    }
  }

  return 'file:./dev.db';
}

function preparePrisma() {
  const dbUrl = getDatabaseUrl();
  let targetProvider = 'sqlite';

  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    targetProvider = 'postgresql';
  } else if (dbUrl.startsWith('mysql://')) {
    targetProvider = 'mysql';
  } else if (dbUrl.startsWith('file:') || dbUrl.endsWith('.db') || dbUrl.includes('.sqlite')) {
    targetProvider = 'sqlite';
  }

  const schemaPath = path.resolve(__dirname, '..', 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    console.error('[prepare-prisma] schema.prisma not found at:', schemaPath);
    return;
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');
  const providerRegex = /datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/;
  const match = schema.match(providerRegex);

  if (match) {
    const currentProvider = match[1];
    if (currentProvider !== targetProvider) {
      console.log(`[prepare-prisma] Switching provider from "${currentProvider}" to "${targetProvider}" to match DATABASE_URL.`);
      const updatedSchema = schema.replace(
        /datasource\s+db\s*\{([\s\S]*?)provider\s*=\s*"[^"]+"/,
        `datasource db {$1provider = "${targetProvider}"`
      );
      fs.writeFileSync(schemaPath, updatedSchema, 'utf8');
      console.log(`[prepare-prisma] Updated prisma/schema.prisma to provider = "${targetProvider}".`);
    } else {
      console.log(`[prepare-prisma] Provider is already "${targetProvider}". Matches DATABASE_URL.`);
    }
  }
}

preparePrisma();
