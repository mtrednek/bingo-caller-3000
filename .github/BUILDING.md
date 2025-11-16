# Building Packages with GitHub Actions

This project uses GitHub Actions to automatically build executable packages for Windows, macOS, and Linux.

## How It Works

The workflow (`.github/workflows/build-packages.yml`) runs on:
- **Push to main branch** - Builds all platforms and stores artifacts
- **Pull requests** - Builds all platforms for testing
- **Version tags** (e.g., `v1.0.0`) - Builds and creates a GitHub Release
- **Manual trigger** - Can be run on-demand from GitHub UI

## Automatic Builds on Push

Every time you push to the main branch:

1. Three parallel jobs run (Windows, macOS, Linux)
2. Each job:
   - Checks out the code
   - Installs Node.js 18
   - Installs dependencies
   - Sets up and seeds the database
   - Builds the standalone application
   - Creates the platform-specific package
   - Uploads the package as an artifact

3. Artifacts are available for 30 days in GitHub Actions

## Manual Builds

To manually trigger a build:

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Build Packages** workflow
4. Click **Run workflow** dropdown
5. Select the branch
6. Click **Run workflow** button

## Creating a Release

To create a release with all packages:

1. Create and push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. GitHub Actions will:
   - Build all three platforms
   - Create a new GitHub Release
   - Attach all executables to the release
   - Generate release notes automatically

3. The release will be available at:
   ```
   https://github.com/YOUR-USERNAME/bingo/releases
   ```

## Downloading Built Packages

### From Workflow Run (any push)

1. Go to **Actions** tab
2. Click on the workflow run
3. Scroll to **Artifacts** section at the bottom
4. Download:
   - `bingo-caller-windows` (Windows .exe)
   - `bingo-caller-macos` (macOS executable)
   - `bingo-caller-linux` (Linux executable)

### From Release (tagged versions)

1. Go to **Releases** tab
2. Click on the version
3. Download from **Assets** section

## Package Contents

Each package includes:
- ✅ Node.js runtime (embedded)
- ✅ Next.js application (standalone build)
- ✅ Socket.IO server
- ✅ Pre-seeded database with patterns and admin user
- ✅ All dependencies
- ✅ Launcher script

## Build Times

Approximate build times per platform:
- **Windows**: 5-8 minutes
- **macOS**: 5-8 minutes
- **Linux**: 4-7 minutes

Total workflow time: ~8-10 minutes (runs in parallel)

## Troubleshooting

### Build Failed

Check the workflow logs:
1. Go to **Actions** tab
2. Click on the failed run
3. Click on the failed job (Windows/macOS/Linux)
4. Expand the failed step to see error details

Common issues:
- **Dependency installation fails**: Check package.json for issues
- **Build fails**: Check for TypeScript/ESLint errors
- **Package creation fails**: Check that caxa is installed correctly
- **Database setup fails**: Check Prisma schema and seed file

### Artifacts Not Uploading

Ensure:
- Package files are created in `dist-packages/` directory
- File names match exactly: `bingo-caller-windows.exe`, `bingo-caller-macos`, `bingo-caller-linux`
- GitHub Actions has proper permissions

### Release Not Created

For releases to work:
- You must push a tag starting with `v` (e.g., `v1.0.0`, `v2.1.3`)
- All three platform builds must succeed
- Repository must have releases enabled

## Customization

### Change Build Triggers

Edit `.github/workflows/build-packages.yml`:

```yaml
on:
  push:
    branches:
      - main
      - develop  # Add more branches
```

### Change Node.js Version

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Change version
```

### Skip Database Seeding

If you don't want to include a pre-seeded database:

1. Remove the "Setup database" step from workflow
2. Uncomment `prisma/dev.db` in `.caxaignore`

### Change Artifact Retention

Default is 30 days. To change:

```yaml
- name: Upload Windows package
  uses: actions/upload-artifact@v4
  with:
    retention-days: 90  # Change to desired days
```

## Cost and Usage

GitHub Actions provides:
- **Public repositories**: Unlimited minutes
- **Private repositories**: 2,000 minutes/month (free tier)

Each full build uses approximately:
- **Windows**: ~10 minutes
- **macOS**: ~10 minutes (counts as 10× multiplier)
- **Linux**: ~8 minutes

Total per build: ~18 minutes + ~100 macOS minutes = ~118 minutes

## Local Building vs GitHub Actions

| Aspect | Local Build | GitHub Actions |
|--------|-------------|----------------|
| Speed | Faster (already has deps) | Slower (fresh install) |
| Cross-platform | Limited | Full (all platforms) |
| Consistency | Varies by machine | Reproducible |
| Setup | Requires local tools | No local setup needed |
| Best for | Quick testing | Production releases |

## Best Practices

1. **Test locally first** before pushing
2. **Use version tags** for official releases
3. **Check artifacts** before creating releases
4. **Include release notes** in tag messages
5. **Test packages** on target platforms before distributing

## Security Notes

- Database in packages uses default password (`admin123`)
- **Always** document that users must change password
- Consider using environment variables for credentials
- Don't commit `.env` files with secrets

## Example: Complete Release Process

```bash
# 1. Ensure code is ready
git status
git log

# 2. Update version in package.json
npm version patch  # or minor, or major

# 3. Commit version bump
git add package.json
git commit -m "Bump version to $(node -p "require('./package.json').version")"

# 4. Create and push tag
git tag v$(node -p "require('./package.json').version")
git push origin main
git push origin --tags

# 5. Wait for GitHub Actions to complete (~10 minutes)

# 6. Check release at:
# https://github.com/YOUR-USERNAME/bingo/releases

# 7. Test downloaded packages on each platform

# 8. Update release notes if needed
```

## Getting Help

- Check workflow runs in **Actions** tab
- Review error logs for specific issues
- See [GitHub Actions documentation](https://docs.github.com/en/actions)
- Open an issue if builds consistently fail

---

**Happy building! 🎯**
