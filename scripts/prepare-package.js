#!/usr/bin/env node

/**
 * Prepare Package Script
 *
 * This script prepares the project for packaging by:
 * 1. Checking all prerequisites
 * 2. Building the application
 * 3. Creating/verifying the database
 * 4. Running the packaging process
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎯 Bingo Caller 3000 - Package Preparation\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Helper function to run commands
function run(command, description) {
  console.log(`⚙️  ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    return false;
  }
}

// Helper function to check file exists
function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description} exists`);
    return true;
  } else {
    console.log(`⚠️  ${description} not found`);
    return false;
  }
}

// 1. Check Prerequisites
console.log('📋 Step 1: Checking Prerequisites\n');

checkFile(path.join(__dirname, '..', 'node_modules'), 'Node modules');
checkFile(path.join(__dirname, '..', '.env'), 'Environment file');
checkFile(path.join(__dirname, '..', 'package.json'), 'Package.json');

// 2. Check if we want to include a seeded database
console.log('\n📊 Step 2: Database Setup\n');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const dbExists = fs.existsSync(dbPath);

if (dbExists) {
  const stats = fs.statSync(dbPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`✅ Database found (${sizeKB} KB)`);
  console.log(`   This database will be included in the package.`);
  console.log(`   Users will have patterns and default admin user.\n`);
} else {
  console.log(`⚠️  No database found.`);
  console.log(`   Users will need to create and seed database after installation.\n`);
  console.log(`   To include a pre-seeded database, run:`);
  console.log(`   npm run db:push && npm run db:seed\n`);
}

// Ask user if they want to continue
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Continue with packaging? (y/n): ', (answer) => {
  readline.close();

  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Packaging cancelled.\n');
    process.exit(0);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 3. Build standalone application
  console.log('🔨 Step 3: Building Application\n');
  if (!run('npm run build:standalone', 'Build standalone application')) {
    console.error('\n❌ Build failed. Please fix errors and try again.\n');
    process.exit(1);
  }

  // 4. Verify build outputs
  console.log('🔍 Step 4: Verifying Build Outputs\n');

  const standaloneServer = path.join(__dirname, '..', '.next', 'standalone', 'server.js');
  const socketServer = path.join(__dirname, '..', 'dist', 'server', 'index.js');

  if (!checkFile(standaloneServer, 'Next.js standalone server') ||
      !checkFile(socketServer, 'Socket.IO server')) {
    console.error('\n❌ Build verification failed.\n');
    process.exit(1);
  }

  console.log('\n✅ All build outputs verified\n');

  // 5. Check dist-packages directory
  const distDir = path.join(__dirname, '..', 'dist-packages');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('📁 Created dist-packages directory\n');
  }

  // 6. Run packaging
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📦 Step 5: Creating Packages\n');

  if (!run('npm run package:all', 'Package for all platforms')) {
    console.error('\n❌ Packaging failed.\n');
    process.exit(1);
  }

  // 7. Verify packages were created
  console.log('\n🔍 Step 6: Verifying Packages\n');

  const packages = [
    { file: 'bingo-caller-windows.exe', platform: 'Windows' },
    { file: 'bingo-caller-macos', platform: 'macOS' },
    { file: 'bingo-caller-linux', platform: 'Linux' }
  ];

  let allPackagesCreated = true;
  packages.forEach(pkg => {
    const pkgPath = path.join(distDir, pkg.file);
    if (checkFile(pkgPath, `${pkg.platform} package`)) {
      const stats = fs.statSync(pkgPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   Size: ${sizeMB} MB`);
    } else {
      allPackagesCreated = false;
    }
  });

  // 8. Final summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (allPackagesCreated) {
    console.log('🎉 SUCCESS! All packages created!\n');
    console.log('📦 Packages location: dist-packages/\n');
    console.log('📝 Next steps:');
    console.log('   1. Test each package on target platforms');
    console.log('   2. Include USER-GUIDE.md with distributions');
    console.log('   3. Update README with download links');
    console.log('   4. Consider code signing for production\n');
    console.log('📖 See PACKAGING.md for distribution guide\n');
  } else {
    console.log('⚠️  Some packages failed to create.\n');
    console.log('   Check the errors above and try again.\n');
    process.exit(1);
  }
});
