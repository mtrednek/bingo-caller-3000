#!/usr/bin/env node

/**
 * Copy Static Assets Script
 *
 * Next.js standalone builds don't automatically include static assets.
 * This script copies the necessary static files to the standalone build directory.
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Copying static assets to standalone build...\n');

const rootDir = path.join(__dirname, '..');
const staticSource = path.join(rootDir, '.next', 'static');
const staticDest = path.join(rootDir, '.next', 'standalone', '.next', 'static');

// Recursively copy directory
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source not found: ${src}`);
    return false;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

// Copy .next/static to .next/standalone/.next/static
if (copyRecursive(staticSource, staticDest)) {
  console.log('✅ Static assets copied successfully');
  console.log(`   From: ${staticSource}`);
  console.log(`   To:   ${staticDest}\n`);
} else {
  console.error('❌ Failed to copy static assets');
  process.exit(1);
}

// Also copy public folder if it exists
const publicSource = path.join(rootDir, 'public');
const publicDest = path.join(rootDir, '.next', 'standalone', 'public');

if (fs.existsSync(publicSource)) {
  if (copyRecursive(publicSource, publicDest)) {
    console.log('✅ Public folder copied successfully');
    console.log(`   From: ${publicSource}`);
    console.log(`   To:   ${publicDest}\n`);
  } else {
    console.error('❌ Failed to copy public folder');
    process.exit(1);
  }
} else {
  console.log('ℹ️  No public folder to copy\n');
}

// Copy Prisma schema to standalone build
const prismaSource = path.join(rootDir, 'prisma');
const prismaDest = path.join(rootDir, '.next', 'standalone', 'prisma');

if (fs.existsSync(prismaSource)) {
  if (copyRecursive(prismaSource, prismaDest)) {
    console.log('✅ Prisma schema copied successfully');
    console.log(`   From: ${prismaSource}`);
    console.log(`   To:   ${prismaDest}\n`);
  } else {
    console.error('❌ Failed to copy Prisma schema');
    process.exit(1);
  }
} else {
  console.log('ℹ️  No Prisma schema to copy\n');
}

console.log('🎉 All assets copied successfully!\n');
