#!/usr/bin/env node

/**
 * Database Initialization Script
 *
 * This script initializes the database schema and creates a default admin user.
 * It's designed to be run on first launch of the packaged application.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Helper function to create default data
async function handleDefaultData(prisma, isNewDb) {
  if (!isNewDb) {
    return;
  }

  console.log('👤 Creating default admin user...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' }
  }).catch(() => null);

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@bingocaller.local',
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('✅ Default admin user created');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  IMPORTANT: Change this password immediately!\n');
  } else {
    console.log('ℹ️  Admin user already exists\n');
  }

  // Create default display config
  const existingConfig = await prisma.displayConfig.findFirst().catch(() => null);
  if (!existingConfig) {
    await prisma.displayConfig.create({
      data: {
        currentJokeIndex: 0,
        gamesDisplaySeconds: 16,
        jokeQuestionSeconds: 4,
        jokeAnswerSeconds: 4,
        displayMargin: 0
      }
    });
    console.log('✅ Default display configuration created\n');
  }
}

async function initDatabase(dbPath) {
  console.log('📊 Initializing database...\n');

  // Check if database file exists
  const dbExists = fs.existsSync(dbPath);
  const dbNew = !dbExists;

  if (dbNew) {
    console.log('Creating new database file...');
  }

  // Import Prisma client
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Try to query the database to check if schema exists
    console.log('⚙️  Checking database schema...');
    try {
      await prisma.user.findFirst();
      console.log('✅ Database schema exists\n');
    } catch (error) {
      // Schema doesn't exist - need to run migrations
      console.log('⚠️  Database schema missing. Running migrations...');
      await prisma.$disconnect();

      try {
        execSync('npx prisma db push --skip-generate --accept-data-loss', {
          stdio: 'inherit',
          env: { ...process.env }
        });
        console.log('✅ Database schema created\n');
      } catch (pushError) {
        console.error('❌ Failed to create schema with prisma db push');
        throw pushError;
      }

      // Reconnect after schema creation
      const prisma2 = new PrismaClient();
      await handleDefaultData(prisma2, dbNew);
      await prisma2.$disconnect();
      return true;
    }

    await handleDefaultData(prisma, dbNew);
    await prisma.$disconnect();

    console.log('🎉 Database initialization complete!\n');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('\nPlease check:');
    console.error('  1. Database file permissions');
    console.error('  2. Prisma schema is valid');
    console.error('  3. Database file is not corrupted\n');
    return false;
  }
}

// If called directly
if (require.main === module) {
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') ||
                 path.join(__dirname, '..', 'prisma', 'dev.db');

  initDatabase(dbPath)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { initDatabase };
