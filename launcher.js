#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Configuration
const NEXT_PORT = process.env.PORT || 3000;
const SOCKET_PORT = process.env.SOCKET_PORT || 3001;
const APP_URL = `http://localhost:${NEXT_PORT}`;

console.log('🎯 Bingo Caller 3000 - Starting...\n');

// Determine if we're running from packaged executable or development
const isPackaged = __dirname.includes('.caxa') || process.pkg;
const rootDir = isPackaged ? path.join(__dirname, '..') : __dirname;

// Set environment variables
process.env.NEXT_PUBLIC_APP_URL = APP_URL;
process.env.NEXTAUTH_URL = APP_URL;
process.env.AUTH_TRUST_HOST = 'true';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'super-secret-key-change-in-production';
process.env.SOCKET_PORT = SOCKET_PORT;
process.env.NEXT_PUBLIC_SOCKET_URL = `http://localhost:${SOCKET_PORT}`;

// Database setup
const dbPath = path.join(rootDir, 'prisma', 'dev.db');
const dbDir = path.dirname(dbPath);
const prismaSchemaPath = path.join(rootDir, 'prisma', 'schema.prisma');

// Ensure prisma directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Created database directory');
}

// Check if database needs initialization
const needsInit = !fs.existsSync(dbPath);
if (needsInit) {
  console.log('📊 Database not found. Will initialize after servers start...');
}

// Set database URL - use absolute path for SQLite
process.env.DATABASE_URL = `file:${dbPath}`;
// Set Prisma schema path for Prisma Client
process.env.PRISMA_SCHEMA_PATH = prismaSchemaPath;

let nextServer;
let socketServer;
let browserOpened = false;

// Function to open browser
function openBrowser(url) {
  if (browserOpened) return;
  browserOpened = true;

  const start = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';

  setTimeout(() => {
    exec(`${start} ${url}`, (err) => {
      if (err) {
        console.log(`\n🌐 Please open your browser to: ${url}`);
      } else {
        console.log(`\n🌐 Opening browser to: ${url}`);
      }
    });
  }, 2000);
}

// Function to initialize database
function initializeDatabase() {
  console.log('🔧 Initializing database schema...\n');

  const initScript = isPackaged
    ? path.join(rootDir, 'scripts', 'init-database.js')
    : path.join(__dirname, 'scripts', 'init-database.js');

  try {
    execSync(`"${process.execPath}" "${initScript}"`, {
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Database initialized successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    console.error('   The application may not work correctly.\n');
    return false;
  }
}

// Start Socket.IO server
function startSocketServer() {
  console.log('🚀 Starting Socket.IO server...');

  const socketScript = isPackaged
    ? path.join(rootDir, 'dist', 'server', 'index.js')
    : path.join(__dirname, 'dist', 'server', 'index.js');

  socketServer = spawn(process.execPath, [socketScript], {
    env: { ...process.env },
    stdio: 'inherit'
  });

  socketServer.on('error', (err) => {
    console.error('❌ Socket.IO server error:', err);
  });

  socketServer.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Socket.IO server exited with code ${code}`);
    }
  });
}

// Start Next.js server
function startNextServer() {
  console.log('🚀 Starting Next.js server...');

  const nextServerScript = isPackaged
    ? path.join(rootDir, '.next', 'standalone', 'server.js')
    : path.join(__dirname, '.next', 'standalone', 'server.js');

  if (!fs.existsSync(nextServerScript)) {
    console.error('❌ Next.js standalone server not found!');
    console.error('   Run "npm run build" first to create the standalone build.');
    process.exit(1);
  }

  // For standalone server, ensure paths are relative to standalone directory
  const standaloneDir = path.dirname(nextServerScript);
  const standalonePrismaDir = path.join(standaloneDir, 'prisma');
  const standaloneDbPath = path.join(standalonePrismaDir, 'dev.db');

  // Copy database to standalone location if it doesn't exist there
  if (fs.existsSync(dbPath) && !fs.existsSync(standaloneDbPath)) {
    if (!fs.existsSync(standalonePrismaDir)) {
      fs.mkdirSync(standalonePrismaDir, { recursive: true });
    }
    fs.copyFileSync(dbPath, standaloneDbPath);
    console.log('📋 Copied database to standalone build location\n');
  }

  nextServer = spawn(process.execPath, [nextServerScript], {
    env: {
      ...process.env,
      PORT: NEXT_PORT,
      HOSTNAME: '0.0.0.0',
      DATABASE_URL: `file:${standaloneDbPath}`,
      PRISMA_SCHEMA_PATH: path.join(standalonePrismaDir, 'schema.prisma')
    },
    stdio: 'inherit',
    cwd: standaloneDir
  });

  nextServer.on('error', (err) => {
    console.error('❌ Next.js server error:', err);
  });

  nextServer.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Next.js server exited with code ${code}`);
    }
  });

  // Open browser after Next.js starts
  setTimeout(() => {
    openBrowser(APP_URL);
  }, 3000);
}

// Graceful shutdown
function shutdown() {
  console.log('\n\n👋 Shutting down Bingo Caller 3000...');

  if (nextServer) {
    nextServer.kill('SIGTERM');
  }

  if (socketServer) {
    socketServer.kill('SIGTERM');
  }

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('exit', () => {
  if (nextServer) nextServer.kill();
  if (socketServer) socketServer.kill();
});

// Start servers
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  🎯 BINGO CALLER 3000');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  App URL:       ${APP_URL}`);
console.log(`  Socket Server: http://localhost:${SOCKET_PORT}`);
console.log(`  Database:      ${dbPath}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check if Socket.IO server build exists
const socketDist = isPackaged
  ? path.join(rootDir, 'dist', 'server', 'index.js')
  : path.join(__dirname, 'dist', 'server', 'index.js');

if (!fs.existsSync(socketDist)) {
  if (isPackaged) {
    console.error('❌ Socket.IO server build not found in package!');
    console.error('   This package may be corrupted or incomplete.');
    console.error('   Please download a fresh copy.');
    process.exit(1);
  } else {
    console.log('⚠️  Socket.IO server build not found. Building...');
    const buildSocket = spawn('npm', ['run', 'build:socket'], {
      stdio: 'inherit',
      shell: true
    });

    buildSocket.on('exit', (code) => {
      if (code === 0) {
        // Initialize database if needed
        if (needsInit) {
          if (!initializeDatabase()) {
            console.error('⚠️  Database initialization had errors, but attempting to start anyway...\n');
          }
        }

        startSocketServer();
        startNextServer();
      } else {
        console.error('❌ Failed to build Socket.IO server');
        process.exit(1);
      }
    });
  }
} else {
  // Initialize database if needed
  if (needsInit) {
    if (!initializeDatabase()) {
      console.error('⚠️  Database initialization had errors, but attempting to start anyway...\n');
    }
  }

  startSocketServer();
  startNextServer();
}

console.log('\n💡 Tips:');
console.log('   • Press Ctrl+C to stop the server');
console.log('   • Login with username: admin, password: admin123');
console.log('   • Change the default password immediately!\n');
