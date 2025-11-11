#!/usr/bin/env node

/**
 * Simple startup script for Bingo Caller 3000
 * Runs only the Next.js server without Socket.io for basic functionality
 */

const { spawn } = require('child_process')
const path = require('path')

console.log('🎯 Starting Bingo Caller 3000 (Simple Mode)')
console.log('📝 Note: Real-time features require Socket.io server')
console.log('💡 Use "npm run dev" for full functionality\n')

// Start Next.js development server
const nextProcess = spawn('npm', ['run', 'next:dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..')
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...')
  nextProcess.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...')
  nextProcess.kill('SIGTERM')
  process.exit(0)
})

nextProcess.on('exit', (code) => {
  console.log(`\n📊 Next.js process exited with code ${code}`)
  process.exit(code)
})