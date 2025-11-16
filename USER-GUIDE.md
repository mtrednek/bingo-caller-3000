# Bingo Caller 3000 - User Guide

## Quick Start

### Windows
1. Double-click `bingo-caller-windows.exe`
2. Wait for the browser to open automatically
3. If browser doesn't open, go to: http://localhost:3000

### macOS
1. Right-click `bingo-caller-macos` and select "Open"
   (First time only - macOS security requirement)
2. Click "Open" in the security dialog
3. Wait for the browser to open automatically

### Linux
1. Open terminal in the folder containing the executable
2. Make it executable: `chmod +x bingo-caller-linux`
3. Run: `./bingo-caller-linux`
4. Wait for the browser to open automatically

## First Time Setup

### 1. Login
Default credentials:
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change this password immediately after logging in!

### 2. Change Password
1. Click your username in the top right
2. Select "Profile" or "Settings"
3. Change your password
4. Logout and login with new password

### 3. Create Your First Session
1. Click "Admin Dashboard"
2. Click "Create New Session"
3. Fill in:
   - Session name (e.g., "Monday Night Bingo")
   - Number of players
   - Packet pricing
   - Add games with patterns and prizes
4. Click "Create Session"

## Using the Application

### Admin Dashboard
- Create and manage sessions
- View financial summaries
- Track player counts and revenue
- Edit ongoing sessions

### Game Control
- Start games
- Call numbers (manual or auto-call)
- Verify winners
- Reset if needed

**Keyboard Shortcuts:**
- `Space` - Call next number
- `V` - Verify winner
- `A` - Toggle auto-call
- `R` - Reset game
- `?` - Show help

### Display Screen
The public display screen shows:
- Current pattern
- Called numbers
- Number board
- Prize information

**To show on projector/TV:**
1. Open the display URL on the display computer
2. Press F11 for fullscreen
3. Callers use the control panel on another device

## Common Tasks

### Starting a Bingo Session
1. Go to Admin Dashboard
2. Create or select a session
3. Click "Open Display" (on projector/TV)
4. Click "Start Session"
5. In Game Control, select first game
6. Click "Start Game"
7. Begin calling numbers

### Calling Numbers
**Manual:**
- Click "Call Number" button
- Or press `Space` on keyboard

**Auto-Call:**
- Click "Auto Call" toggle
- Numbers called every 10 seconds
- Click again to stop

**Manual Entry:**
- Type specific number (e.g., "B12")
- Press Enter

### Verifying a Winner
1. Player calls "BINGO!"
2. Press `V` or click "Verify Winner"
3. Enter winner's name
4. Optional: Enter card number
5. Click "Confirm"
6. Game automatically advances to next game

## Troubleshooting

### Application Won't Start
- **Windows:** Check Windows Defender didn't block it
  - Click "More info" → "Run anyway"
- **macOS:** Right-click → Open (don't double-click)
- **Linux:** Ensure file is executable: `chmod +x bingo-caller-linux`
- Check if ports 3000 or 3001 are already in use

### Browser Doesn't Open
Manually open your browser to: **http://localhost:3000**

### Can't Login
- Check caps lock is off
- Default username: `admin`
- Default password: `admin123`
- If changed and forgotten, you'll need to reset the database

### Port Already in Use
Someone else is using port 3000 or 3001:

**Windows:**
```
set PORT=3002
set SOCKET_PORT=3003
bingo-caller-windows.exe
```

**macOS/Linux:**
```bash
PORT=3002 SOCKET_PORT=3003 ./bingo-caller-macos
```

Then open: http://localhost:3002

### Display Not Updating
1. Check Socket.IO connection (green indicator in corner)
2. Refresh the display page
3. Ensure both servers are running (check terminal)
4. Check firewall isn't blocking ports

### Pattern Not Showing
1. Verify database was seeded with patterns
2. Check that pattern is marked as "active"
3. Refresh the page

## System Requirements

### Minimum
- **RAM:** 2GB
- **Disk Space:** 500MB
- **OS:** Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Browser:** Chrome, Firefox, Edge, Safari (latest)

### Recommended
- **RAM:** 4GB+
- **Disk Space:** 1GB
- **Display:** 1920x1080 or higher for public display
- **Network:** Local network for multiple devices

## Network Setup

### Single Computer (Standalone)
- Everything runs on one computer
- Access at http://localhost:3000
- No network configuration needed

### Multiple Devices (LAN)
To access from other devices on your network:

1. Find your computer's IP address:
   - **Windows:** `ipconfig` (look for IPv4)
   - **macOS/Linux:** `ifconfig` or `ip addr`

2. On other devices, use: `http://[YOUR-IP]:3000`
   - Example: `http://192.168.1.100:3000`

3. **Firewall:** Allow ports 3000 and 3001
   - Windows: Windows Defender Firewall → Allow an app
   - macOS: System Preferences → Security & Privacy → Firewall
   - Linux: `sudo ufw allow 3000` and `sudo ufw allow 3001`

## Data and Backups

### Database Location
The database is stored in:
- `prisma/dev.db` (next to the executable)

### Backing Up
**Important:** Backup before major events!

**To backup:**
1. Stop the application
2. Copy `prisma/dev.db` to a safe location
3. Add date to filename: `dev.db.2024-11-10`

**To restore:**
1. Stop the application
2. Replace `prisma/dev.db` with your backup
3. Restart the application

### Resetting the Database
If you want to start fresh:
1. Stop the application
2. Delete `prisma/dev.db`
3. Restart the application
4. Database will be recreated
5. Re-seed patterns and users (contact support)

## Tips for Best Experience

### For Callers
- Use keyboard shortcuts to speed up calling
- Enable auto-call for faster games
- Keep manual entry ready for special calls
- Always verify winners carefully

### For Display
- Use fullscreen mode (F11)
- Ensure high contrast for visibility
- Test from the back of the room
- Consider font size for large halls

### For Sessions
- Create sessions ahead of time
- Double-check prize amounts before starting
- Test equipment before players arrive
- Have a backup plan if internet fails (standalone mode)

## Getting Help

### Error Messages
- Check the terminal/console for detailed errors
- Screenshot any error messages
- Note what you were doing when error occurred

### Community Support
- GitHub Issues: [Your GitHub URL]
- Documentation: README.md
- Email: [Your support email]

## Legal

This software is provided as-is under the MIT License.
See LICENSE file for details.

**Note:** This is for entertainment and fundraising purposes.
Check local gambling laws regarding cash prizes in your jurisdiction.

---

## Quick Reference Card

### Default Login
- Username: `admin`
- Password: `admin123`

### URLs
- **Admin/Caller:** http://localhost:3000
- **Display:** http://localhost:3000/display/[session-id]

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Call next number |
| `V` | Verify winner |
| `A` | Toggle auto-call |
| `R` | Reset game |
| `?` | Show shortcuts |

### Ports
- Web App: 3000
- Socket.IO: 3001

### Support Checklist
- [ ] Check terminal for errors
- [ ] Verify ports aren't blocked
- [ ] Test browser at http://localhost:3000
- [ ] Check database file exists
- [ ] Restart application
- [ ] Check firewall settings

---

**Have a great game! 🎯**
