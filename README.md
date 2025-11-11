# 🎯 Bingo Caller 3000

A professional, full-featured Bingo calling system built with Next.js 15, featuring real-time gameplay, comprehensive pattern support, keyboard shortcuts, and distance-optimized displays perfect for community halls, retirement homes, and fundraising events.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![SQLite](https://img.shields.io/badge/Database-SQLite-blue?style=flat-square&logo=sqlite)

---

## ✨ Features

### 🎮 Complete Bingo Experience
- **120+ Professional Patterns**: Traditional lines, letters (all 26!), shapes, holidays, and special patterns
- **Cryptographic RNG**: Secure, auditable random number generation using Fisher-Yates shuffle
- **Real-time Updates**: Socket.IO integration for instant synchronization across devices
- **Auto-Call Mode**: Configurable interval calling for hands-free operation
- **Winner Verification**: Built-in verification system with audit trails
- **Excluded Numbers**: Ability to exclude specific letter ranges (B, I, N, G, O) per game
- **Manual Number Entry**: Call specific numbers when needed

### 📱 Multi-Interface Design
- **Admin Dashboard**: Create and manage bingo sessions with financial tracking
- **Game Control Panel**: Intuitive calling interface with keyboard shortcuts
- **Public Display Screen**: Large, distance-readable displays for players
- **Authentication System**: Role-based access (Admin, Caller, Viewer)

### 🎨 User-Friendly Interface
- **First-Time Guide**: Automatic welcome guide for new users
- **Keyboard Shortcuts**: Space, V, A, R, ? for efficient operation
- **Context Tooltips**: Helpful hints throughout the interface
- **Dismissible Tips**: Toggle help system on/off as needed
- **Extra Large Fonts**: High contrast, distance-optimized UI
- **Animated Displays**: Visual effects for called numbers
- **Responsive Design**: Works on tablets, desktops, and large displays

### 💰 Financial Management
- **Revenue Tracking**: Monitor single and double packet sales
- **Operating Costs**: Track per-player or per-packet costs
- **Prize Allocation**: Automatic prize pool calculation
- **Double Prize Games**: Last two games automatically receive 2x prizes
- **Real-time Updates**: Financial summary always visible

### 🔒 Enterprise Security
- **NextAuth.js v5**: Modern authentication framework
- **Secure Password Hashing**: bcrypt with salt rounds
- **Environment Variables**: Configurable credentials
- **Role-based Permissions**: Admin, Caller, and Viewer roles
- **Input Validation**: CSRF protection and sanitization

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Game Patterns](#-game-patterns-51-included)
- [Keyboard Shortcuts](#%EF%B8%8F-keyboard-shortcuts)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [API Documentation](#-api-endpoints)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18 or higher
- **npm** or yarn package manager
- Basic command line knowledge

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mtrednek/bingo-caller-3000.git
cd bingo-caller-3000

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and set your passwords!

# 4. Initialize the database
npm run db:generate
npm run db:push
npm run db:seed

# 5. Start the application
npm run dev
```

### First Time Access

1. Visit **http://localhost:3000**
2. Click "Sign In"
3. Login with default credentials:
   - Username: `admin`
   - Password: `admin123` (⚠️ CHANGE THIS IMMEDIATELY!)
4. Follow the Quick Start Guide that appears

> **🔐 SECURITY WARNING**: The default password is `admin123`. You must change this immediately after first login! Go to your profile or set `ADMIN_PASSWORD` in `.env` before running `npm run db:seed`.

---

## 📖 Usage Guide

### For Administrators

#### Creating a Session
1. Login and navigate to **Admin Dashboard**
2. Click **"Create New Session"**
3. Configure session details:
   - **Session Name**: e.g., "Monday Night Bingo"
   - **Number of Players**: Total attendees
   - **Duration**: Session length in minutes
   - **Packets**: Single and double packet counts
   - **Pricing**: Packet prices and operating costs
4. Add games:
   - Select pattern from 51 options
   - Set prize value
   - Optionally exclude number ranges (B, I, N, G, O)
5. Click **"Create Session & Open Display"**

#### Managing Sessions
- View all sessions from the dashboard
- Edit player counts and pricing mid-session
- Pause/Resume sessions as needed
- Track financial metrics in real-time

### For Callers

#### Starting a Game
1. Navigate to **Game Control** panel
2. Select a game from the list
3. Click **"Start"** to begin calling

#### Calling Numbers
- **Manual**: Click "Call Number" or press `Space`
- **Auto**: Enable auto-call (calls every 10 seconds)
- **Manual Entry**: Type specific number and press Enter
- **View Pattern**: See current pattern and prize value

#### Verifying Winners
1. When someone calls "BINGO!", press `V` or click "Verify Win"
2. Enter winner's name and optional card number
3. Click "Confirm Winner"
4. System automatically advances to next game

#### Keyboard Shortcuts ⌨️
- **Space**: Call next number
- **V**: Verify winner
- **A**: Toggle auto-call
- **R**: Reset current game
- **?**: Show keyboard shortcuts

### For Players/Viewers

#### Public Display
1. Open display screen at `/display/[sessionId]`
2. **Pre-Game**: View all games and prize amounts
3. **During Game**:
   - See current pattern
   - Watch for called numbers
   - Track progress with number board
4. **Between Games**: View next game coming up

---

## 🎨 Game Patterns (120 Included)

### Traditional Lines (6 patterns)
| Pattern | Difficulty | Description |
|---------|------------|-------------|
| Single Line | ⭐ Easy | Any horizontal, vertical, or diagonal line |
| Two Lines | ⭐⭐ Medium | Any two separate lines |
| Diagonal | ⭐⭐⭐⭐⭐ Hard | Both diagonal lines |
| Hardway Bingo | ⭐⭐ Medium | Any line without using FREE space |
| Double Bingo | ⭐⭐⭐ Medium | Two lines without FREE space |

### Letters (All 26 letters!)
Complete A-Z alphabet support with multiple variations per letter
- Simple letters: ⭐⭐ Medium
- Complex letters: ⭐⭐⭐⭐ Hard
- Multiple styles for popular letters (A, B, C, etc.)

### Shapes (91 patterns)
| Pattern | Difficulty | Features |
|---------|------------|----------|
| Four Corners | ⭐ Easy | Mark all four corners |
| Small Diamond | ⭐⭐ Medium | Diamond around center |
| Large Diamond | ⭐⭐⭐ Medium | Large diamond covering card |
| Hourglass | ⭐⭐⭐⭐ Hard | Top, bottom rows + diagonals |
| Airplane | ⭐⭐⭐⭐ Hard | Airplane shape |
| Boat | ⭐⭐ Medium | Boat outline |
| Kite | ⭐⭐⭐ Medium | Kite flying upward |
| Arrow Up/Down | ⭐⭐⭐ Medium | Directional arrows |
| Crazy Arrow | ⭐⭐⭐ Medium | Arrow in any direction (rotatable) |
| Top Hat | ⭐⭐⭐ Medium | Top hat shape |
| Champagne Glass | ⭐⭐⭐⭐ Hard | Champagne glass with stem |
| Big Cross | ⭐ Easy | Simple cross pattern |
| Small Cross | ⭐⭐ Medium | Cross through center |
| Large Plus | ⭐⭐⭐ Medium | Plus covering middle row/column |
| Cent Sign | ⭐ Easy | Cent symbol (¢) |
| Lucky Seven | ⭐⭐⭐ Medium | Number 7 pattern |
| Inside Square | ⭐⭐⭐ Medium | Inner square frame |
| Outside Square | ⭐⭐⭐⭐ Hard | Outer border |
| Crazy Bowtie | ⭐ Easy | Bowtie in any diagonal (rotatable) |
| Crazy L | ⭐⭐⭐ Medium | L in any orientation (rotatable) |

### Holiday & Seasonal (3 patterns - activate as needed)
- Christmas Tree, Snowman, Santa ⭐⭐⭐⭐ Hard
- Pumpkin/Jack-o-lantern ⭐⭐⭐⭐ Hard
- Heart, Cupid ⭐⭐⭐⭐ Hard

### Block Patterns (5 patterns)
| Pattern | Size | Rotatable |
|---------|------|-----------|
| Postage Stamp | 2x2 corner | ✅ Any corner |
| Small Block | 2x2 | ✅ Anywhere |
| Medium Block | 3x3 | ✅ Anywhere |
| Large Block | 4x4 | ❌ Fixed |
| Checkerboard | Alternating | ❌ Fixed |

### Special Patterns (4 patterns)
- **Six Pack**: 2x3 block (⭐⭐ Medium, rotatable)
- **Nine Pack**: 3x3 corner (⭐⭐⭐ Medium, rotatable)
- **Railroad Tracks**: Parallel lines (⭐⭐⭐ Medium)
- **Coverall**: Everything except FREE (⭐⭐⭐⭐⭐ Hard)

### Category Breakdown
| Category | Count | Active | Examples |
|----------|-------|--------|----------|
| **Shapes** | 91 | 83 | Diamonds, Arrows, Boats, Animals, Objects |
| **Letters** | 10 | 10 | Complete A-Z alphabet coverage |
| **Blocks** | 5 | 3 | Postage Stamp, Checkerboard, Large Block |
| **Lines** | 5 | 5 | Single, Double, Diagonal, Hardway |
| **Special** | 4 | 4 | Six Pack, Nine Pack, Coverall, Railroad |
| **Holiday** | 3 | 3 | Christmas, Halloween, Valentine's |
| **Crazy** | 2 | 2 | Crazy L, Hardway variations |
| **Total** | **120** | **112** | 8 seasonal patterns inactive by default |

> **Note**: Patterns marked as "inactive" by default (mostly seasonal/holiday themed) can be activated through the admin interface when needed.

---

## ⌨️ Keyboard Shortcuts

| Key | Action | Available When |
|-----|--------|----------------|
| `Space` | Call next number | Game active |
| `V` | Verify winner | Game active |
| `A` | Toggle auto-call | Game active |
| `R` | Reset current game | Game active |
| `?` | Show shortcuts help | Always |

> 💡 **Tip**: Shortcuts don't work when typing in text fields (by design)

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth.js - REQUIRED
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Socket.IO (optional for real-time features)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
SOCKET_PORT=3001

# Admin Credentials (used during seed only)
ADMIN_EMAIL="admin@bingo.local"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-secure-password-here"

# Caller Credentials (optional)
CALLER_EMAIL="caller@bingo.local"
CALLER_USERNAME="caller"
CALLER_PASSWORD="your-secure-password-here"
```

### Generating Secure Keys

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS v3, Shadcn/UI components
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Real-time**: Socket.IO for live updates
- **State Management**: Zustand for client state

### Project Structure
```
bingo-caller/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin interfaces
│   │   ├── dashboard/     # Session management
│   │   └── control/       # Game calling interface
│   ├── display/           # Public display screens
│   └── api/               # API endpoints
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── display/          # Display-specific components
│   ├── patterns/         # Pattern visualizer
│   └── ui/               # Shadcn/UI components
├── lib/                   # Utility libraries
│   ├── patterns.ts       # Pattern definitions
│   ├── rng.ts            # Random number generation
│   ├── db.ts             # Database client
│   └── auth.ts           # Auth configuration
├── prisma/                # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data (patterns + users)
├── hooks/                 # Custom React hooks
├── server/                # Socket.IO server
└── public/                # Static assets
```

### Key Components

#### Pattern System (`lib/patterns.ts`)
- 120 predefined patterns with metadata
- Pattern validation and rotation logic
- Category-based organization
- Difficulty ratings (1-5 stars)

#### RNG System (`lib/rng.ts`)
- Cryptographically secure number generation
- Fisher-Yates shuffle algorithm
- Number exclusion by letter range (B, I, N, G, O)
- Integrity validation
- Call history tracking

#### Display Components
- `PatternVisualizer`: Interactive 5x5 grid display
- `NumberBoard`: Real-time called number tracking
- `GameControl`: Caller interface with shortcuts
- `SessionDashboard`: Admin overview

---

## 📡 API Endpoints

### Sessions
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/[id]` - Get session details
- `PATCH /api/sessions/[id]` - Update session
- `DELETE /api/sessions/[id]` - Delete session
- `POST /api/sessions/[id]/start` - Start session

### Games
- `POST /api/games/[id]/start` - Start game
- `POST /api/games/[id]/call` - Record number call
- `POST /api/games/[id]/winner` - Record winner
- `PATCH /api/games/[id]` - Update game settings
- `POST /api/games/generate` - Auto-generate games

### Patterns
- `GET /api/patterns` - Get all patterns
- `GET /api/patterns/active` - Get active patterns only

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

---

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Database Setup for Production

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed
```

### Deployment Checklist

- [ ] Set secure `NEXTAUTH_SECRET` in production
- [ ] Change all default passwords
- [ ] Use production database (PostgreSQL recommended for scale)
- [ ] Configure proper CORS settings
- [ ] Set up SSL certificates (HTTPS)
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Enable firewall rules
- [ ] Set up automated backups
- [ ] Configure logging and monitoring
- [ ] Test all functionality
- [ ] Document admin procedures

### Recommended Production Setup

```nginx
# Nginx configuration example
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### "Cannot find module 'tsx'" or Socket.IO errors
```bash
# Solution 1: Run without Socket.IO
npm run dev:next

# Solution 2: Install missing dependency
npm install tsx

# Solution 3: Run separately
npm run next:dev    # Terminal 1
npm run socket:dev  # Terminal 2
```

#### TailwindCSS Version Conflicts
```bash
# The app requires TailwindCSS v3
npm uninstall tailwindcss @tailwindcss/postcss
npm install tailwindcss@^3.4.0
npm ls tailwindcss  # Verify version
```

#### Database Issues
```bash
# Reset database
rm prisma/dev.db
npm run db:push
npm run db:seed
```

#### Authentication Issues
1. Check `.env` has `NEXTAUTH_SECRET` set
2. Clear browser cookies
3. Restart development server
4. Verify `.env.local` doesn't conflict

#### Port Already in Use
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or let Next.js auto-assign available port
npm run dev  # Will use 3001, 3002, etc.
```

### Need Help?
1. Check [GitHub Issues](https://github.com/mtrednek/bingo-caller-3000/issues)
2. Review this documentation
3. Check the [SECURITY.md](SECURITY.md) file
4. Open a new issue with:
   - Node.js version (`node --version`)
   - Operating system
   - Error messages
   - Steps to reproduce

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup
```bash
git clone https://github.com/mtrednek/bingo-caller-3000.git
cd bingo-caller-3000
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

---

## 🔒 Security

Security is a top priority. Please see [SECURITY.md](SECURITY.md) for:
- Reporting vulnerabilities
- Security best practices
- Update procedures

**Never commit**:
- `.env` files
- Database files (`.db`)
- Private keys
- Real passwords

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/mtrednek/bingo-caller-3000/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mtrednek/bingo-caller-3000/discussions)
- **Email**: admin@snowymountainsoftware.com

---

## 🎉 Acknowledgments

Built with love using:
- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Shadcn/UI](https://ui.shadcn.com/) - Re-usable components
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [Socket.IO](https://socket.io/) - Real-time communication

Special thanks to all bingo enthusiasts and contributors!

---

<div align="center">

**🎯 Bingo Caller 3000** - Professional Bingo Management System

Made with ❤️ by developers who love bingo

[⭐ Star us on GitHub](https://github.com/mtrednek/bingo-caller-3000) | [🐛 Report Bug](https://github.com/mtrednek/bingo-caller-3000/issues) | [💡 Request Feature](https://github.com/mtrednek/bingo-caller-3000/issues)

</div>
