#!/bin/bash

# Release Automation Script
# This script helps automate the release process by:
# 1. Prompting for version bump type (major, minor, patch)
# 2. Updating package.json with the new version
# 3. Prompting for a commit message
# 4. Creating a git commit and tag
# 5. Pushing to GitHub, which triggers the release workflow

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not a git repository. Please run this script from the project root."
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Working directory is not clean. Please commit or stash your changes first."
    git status --short
    exit 1
fi

# Get current version from package.json
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Current version: $CURRENT_VERSION"

# Parse version numbers
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Prompt for version bump type
echo ""
echo "Select version bump type:"
echo "  1) Major (${MAJOR}.${MINOR}.${PATCH} -> $((MAJOR+1)).0.0)"
echo "  2) Minor (${MAJOR}.${MINOR}.${PATCH} -> ${MAJOR}.$((MINOR+1)).0)"
echo "  3) Patch (${MAJOR}.${MINOR}.${PATCH} -> ${MAJOR}.${MINOR}.$((PATCH+1)))"
echo ""
read -p "Enter choice [1-3]: " CHOICE

case $CHOICE in
    1)
        NEW_VERSION="$((MAJOR+1)).0.0"
        BUMP_TYPE="major"
        ;;
    2)
        NEW_VERSION="${MAJOR}.$((MINOR+1)).0"
        BUMP_TYPE="minor"
        ;;
    3)
        NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH+1))"
        BUMP_TYPE="patch"
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

print_info "New version will be: $NEW_VERSION"

# Check if tag already exists (both with and without 'v' prefix)
if git rev-parse "v$NEW_VERSION" >/dev/null 2>&1; then
    print_error "Tag v$NEW_VERSION already exists. Please choose a different version."
    exit 1
fi

if git rev-parse "$NEW_VERSION" >/dev/null 2>&1; then
    print_error "Tag $NEW_VERSION already exists. Please choose a different version."
    exit 1
fi

# Prompt for commit message
echo ""
read -p "Enter commit message: " COMMIT_MESSAGE

if [ -z "$COMMIT_MESSAGE" ]; then
    print_error "Commit message cannot be empty. Exiting."
    exit 1
fi

# Update package.json version
print_info "Updating package.json to version $NEW_VERSION..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Verify the version was updated
UPDATED_VERSION=$(node -p "require('./package.json').version")
if [ "$UPDATED_VERSION" != "$NEW_VERSION" ]; then
    print_error "Failed to update package.json version. Exiting."
    exit 1
fi

print_info "Version updated successfully in package.json"

# Create git commit
print_info "Creating git commit..."
git add package.json
git commit -m "$COMMIT_MESSAGE"

# Create git tag
TAG_NAME="v$NEW_VERSION"
print_info "Creating git tag: $TAG_NAME"
git tag -a "$TAG_NAME" -m "Release $NEW_VERSION"

# Confirm before pushing
echo ""
print_warning "Ready to push the following to GitHub:"
echo "  - Commit: $COMMIT_MESSAGE"
echo "  - Tag: $TAG_NAME"
echo ""
read -p "Do you want to proceed? [y/N]: " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_warning "Push cancelled. You can manually push later with:"
    echo "  git push origin main"
    echo "  git push origin $TAG_NAME"
    exit 0
fi

# Push to GitHub
print_info "Pushing commit to GitHub..."
git push origin main

print_info "Pushing tag to GitHub..."
git push origin "$TAG_NAME"

print_info "✓ Release process completed successfully!"
print_info "Tag $TAG_NAME has been pushed and will trigger the GitHub Actions workflow."
print_info "Monitor the release at: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
