# Packaging Guide - Bingo Caller 3000

This guide explains how to create standalone executables for Windows, macOS, and Linux.

## Overview

The packaging system creates self-contained executables that:
- Include Node.js runtime
- Bundle the entire application
- Start both Next.js and Socket.IO servers
- Auto-open the browser
- Are ~50-80MB per platform (vs ~150-200MB for Electron)

## Prerequisites

Before packaging, ensure you have:
- Node.js 18+ installed
- All dependencies installed (`npm install`)
- Built the application at least once

## Quick Start - Creating Packages

### 1. Install Dependencies

First time setup:
```bash
npm install
```

This installs `caxa` (the packaging tool) and all dependencies.

### 2. Build All Packages

To create executables for all platforms:
```bash
npm run package
```

This will:
1. Build the Next.js standalone bundle
2. Compile the Socket.IO server
3. Create executables for Windows, macOS, and Linux in `dist-packages/`

**Output:**
- `dist-packages/bingo-caller-windows.exe` (~60-80MB)
- `dist-packages/bingo-caller-macos` (~60-80MB)
- `dist-packages/bingo-caller-linux` (~60-80MB)

### 3. Build for Specific Platform

To build for just one platform:

```bash
# Windows only
npm run package:win

# macOS only
npm run package:mac

# Linux only
npm run package:linux
```

## Testing Locally

Before packaging, test the launcher locally:

```bash
# Build the standalone version
npm run build:standalone

# Test the launcher
npm run start:launcher
```

This ensures everything works before creating the final packages.

## Package Structure

Each executable contains:

```
bingo-caller-{platform}
├── Node.js runtime (embedded)
├── .next/standalone/          # Next.js server
├── dist/server/               # Socket.IO server
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                # For database initialization
├── public/                    # Static assets
└── launcher.js                # Main entry point
```

## Distribution

### For End Users

Distribute the executable with these instructions:

**Windows:**
1. Download `bingo-caller-windows.exe`
2. Double-click to run
3. Browser opens automatically to the app
4. Login with: admin / admin123
5. Change password immediately!

**macOS:**
1. Download `bingo-caller-macos`
2. Right-click → Open (first time only, to bypass Gatekeeper)
3. Browser opens automatically
4. Login with: admin / admin123

**Linux:**
1. Download `bingo-caller-linux`
2. Make executable: `chmod +x bingo-caller-linux`
3. Run: `./bingo-caller-linux`
4. Browser opens automatically
5. Login with: admin / admin123

### Database Setup

The executable will:
1. Create a `prisma/` directory on first run
2. Create an empty database
3. **Users must seed the database** for patterns and initial users

**Option 1: Include a pre-seeded database**
- Create a seeded database during packaging
- Include `prisma/dev.db` in the package
- Users can start immediately

**Option 2: Users seed after first run**
- Users run the app once (creates empty DB)
- Provide a seed script or instructions
- Users populate database

## Advanced Configuration

### Customizing the Package

Edit `package.json` to modify packaging:

```json
{
  "scripts": {
    "package:win": "caxa --input . --output \"dist-packages/bingo-caller-windows.exe\" -- \"{{caxa}}/node_modules/.bin/node\" \"{{caxa}}/launcher.js\"",
  }
}
```

### Excluding Files

Edit `.caxaignore` to exclude files from the package:

```
# Add patterns to exclude
*.log
temp/
```

### Environment Variables

The launcher sets these automatically:
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- `SOCKET_PORT=3001`
- `DATABASE_URL=file:./prisma/dev.db`

Users can override by setting environment variables before running.

## Including a Pre-Seeded Database

To ship with a ready-to-use database:

### 1. Create the Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema
npm run db:push

# Seed data
npm run db:seed
```

### 2. Copy Database to Package

The database at `prisma/dev.db` will be included automatically if it exists when you run `npm run package`.

### 3. Update .caxaignore

Remove or comment out this line in `.caxaignore`:
```
# prisma/dev.db  # Comment this out to include the database
```

### 4. Package

```bash
npm run package
```

Now the executable includes a pre-populated database!

## Troubleshooting

### Package is Too Large

Check `.caxaignore` - you may be including unnecessary files:
```bash
# Check package contents (macOS/Linux)
tar -tzf dist-packages/bingo-caller-macos | less
```

### Executable Won't Start

1. Check that the build completed successfully
2. Verify `launcher.js` exists
3. Test with `npm run start:launcher` first

### Database Issues

The launcher creates `prisma/dev.db` relative to the executable location. If users move the executable, the database path may break.

**Solution:** Document that users should:
1. Create a folder (e.g., `bingo-caller/`)
2. Place executable inside
3. Run from that location

### Port Already in Use

If ports 3000 or 3001 are taken:
```bash
# Users can set different ports
PORT=3002 SOCKET_PORT=3003 ./bingo-caller-linux
```

## Platform-Specific Notes

### Windows
- May show Windows Defender warning (unsigned executable)
- Users need to click "More info" → "Run anyway"
- Consider code signing for production distribution

### macOS
- Will show Gatekeeper warning (unsigned app)
- Users must right-click → Open first time
- Consider notarization for production distribution

### Linux
- Users must make executable: `chmod +x`
- Some distros may require additional permissions
- AppImage format is an alternative for better compatibility

## Production Checklist

Before distributing to users:

- [ ] Test each platform executable
- [ ] Include seeded database OR clear setup instructions
- [ ] Update default admin password in documentation
- [ ] Create user guide/quick start
- [ ] Consider code signing (Windows/macOS)
- [ ] Test on clean machines (no Node.js installed)
- [ ] Verify all patterns load correctly
- [ ] Test Socket.IO connectivity
- [ ] Document firewall requirements
- [ ] Create troubleshooting guide

## Security Notes

**Default Credentials:**
The seeded database uses:
- Username: `admin`
- Password: `admin123`

**⚠️ CRITICAL:** Document that users MUST change this password immediately after first login!

Consider:
- Forcing password change on first login
- Using environment variables for initial credentials
- Including password generator in documentation

## Alternative: Docker Distribution

For advanced users, consider providing a Docker image:

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY .next/standalone ./
COPY public ./public
COPY dist/server ./dist/server
COPY prisma ./prisma
ENV PORT=3000
EXPOSE 3000 3001
CMD ["node", "server.js"]
```

## Support

For issues with packaging:
1. Check build logs for errors
2. Test with `npm run start:launcher`
3. Verify all files in `dist-packages/`
4. Check GitHub Issues

---

**Happy Packaging! 🎯**
