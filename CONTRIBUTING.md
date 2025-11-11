# Contributing to Bingo Caller 3000

First off, thank you for considering contributing to Bingo Caller 3000! It's people like you that make this project great.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Guidelines](#development-guidelines)
- [Pull Request Process](#pull-request-process)
- [Style Guides](#style-guides)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to admin@snowymountainsoftware.com.

### Our Pledge

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Git
- Basic knowledge of TypeScript, React, and Next.js
- Familiarity with bingo gameplay (helpful but not required!)

### Development Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/bingo-caller-3000.git
cd bingo-caller-3000

# 3. Add upstream remote
git remote add upstream https://github.com/mtrednek/bingo-caller-3000.git

# 4. Install dependencies
npm install

# 5. Set up environment
cp .env.example .env
# Edit .env with your settings

# 6. Set up database
npm run db:generate
npm run db:push
npm run db:seed

# 7. Start development server
npm run dev
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream main into your local main
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When creating a bug report, include:

- **Clear title** describing the issue
- **Detailed description** of the problem
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details**:
  - OS and version
  - Node.js version
  - Browser and version
  - Any relevant console errors

**Bug Report Template:**

```markdown
## Bug Description
A clear description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g. macOS 13.0]
- Node: [e.g. 18.17.0]
- Browser: [e.g. Chrome 115]

## Additional Context
Any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear title** for the feature
- **Detailed description** of the proposed functionality
- **Use case** - why is this needed?
- **Mockups** or examples if applicable
- **Alternatives considered**

**Feature Request Template:**

```markdown
## Feature Description
Clear description of the feature.

## Problem it Solves
What problem does this address?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Any other information.
```

### Adding New Patterns

We love new bingo patterns! To add one:

1. **Design the Pattern**
   - Create a 5x5 grid representation
   - Define required cells (0-24)
   - Determine if it can rotate/mirror
   - Assign difficulty (1-5)
   - Choose appropriate category

2. **Add to Database**
   - Edit `prisma/seed.ts`
   - Add pattern to `DATABASE_PATTERNS` array
   - Follow existing format

3. **Test the Pattern**
   - Verify it displays correctly
   - Test rotation if applicable
   - Ensure difficulty is appropriate

4. **Document It**
   - Add to README.md pattern list
   - Include description and difficulty

### Code Contributions

We actively welcome your pull requests for:

- Bug fixes
- New features
- Documentation improvements
- Performance enhancements
- Test coverage improvements
- Accessibility improvements
- Internationalization

## Development Guidelines

### Project Structure

```
bingo-caller/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utility functions
├── hooks/            # Custom React hooks
├── prisma/           # Database schema and migrations
└── server/           # Socket.IO server
```

### Key Technologies

- **Next.js 15**: React framework
- **TypeScript**: Type safety
- **Prisma**: Database ORM
- **TailwindCSS**: Styling
- **Shadcn/UI**: Component library
- **Socket.IO**: Real-time features

### Coding Standards

#### TypeScript

- Use TypeScript for all new code
- Define interfaces for all data structures
- Avoid `any` types - use `unknown` if needed
- Enable strict mode

```typescript
// Good
interface Pattern {
  code: string;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

// Avoid
const pattern: any = { ... };
```

#### React Components

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and variable names
- Extract reusable logic into custom hooks

```typescript
// Good - focused component
function PatternDisplay({ pattern }: { pattern: Pattern }) {
  return <div>{pattern.name}</div>
}

// Avoid - component doing too much
function MegaComponent() {
  // 500 lines of code...
}
```

#### File Organization

- One component per file
- Colocate related files
- Use index.ts for clean imports
- Keep file names consistent with component names

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

**Writing Tests:**

- Write tests for new features
- Update tests when changing functionality
- Aim for >80% code coverage
- Test both happy paths and edge cases

```typescript
// Example test
describe('Pattern Validator', () => {
  it('should validate a winning pattern', () => {
    const pattern = getPattern('single_line');
    const markedCells = [0, 1, 2, 3, 4];
    expect(validatePattern(markedCells, pattern)).toBe(true);
  });

  it('should reject invalid pattern', () => {
    const pattern = getPattern('single_line');
    const markedCells = [0, 1, 2];
    expect(validatePattern(markedCells, pattern)).toBe(false);
  });
});
```

### Database Changes

When modifying the database schema:

```bash
# 1. Update prisma/schema.prisma

# 2. Generate migration
npx prisma migrate dev --name descriptive_migration_name

# 3. Update seed file if needed
# Edit prisma/seed.ts

# 4. Test migration
npm run db:seed
```

### Performance Considerations

- Minimize re-renders with `useMemo` and `useCallback`
- Use server components where possible
- Optimize images and assets
- Lazy load components when appropriate
- Monitor bundle size

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

### Submitting a Pull Request

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, documented code
   - Follow style guidelines
   - Add/update tests

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new bingo pattern"
   ```

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Use the PR template
   - Link related issues
   - Add screenshots for UI changes
   - Request review from maintainers

### Pull Request Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
How has this been tested?

## Screenshots
If applicable.

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs
   - Tests must pass
   - Linting must pass
   - Build must succeed

2. **Code Review**
   - At least one maintainer approval required
   - Address all feedback
   - Keep discussions professional

3. **Merge**
   - Squash and merge for clean history
   - Delete branch after merge

## Style Guides

### Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add Christmas tree pattern
fix: resolve RNG duplication issue
docs: update installation instructions
refactor: simplify pattern validation logic
```

### Code Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

- Use 2 spaces for indentation
- Max line length: 100 characters
- Use semicolons
- Single quotes for strings (except JSX)
- Trailing commas in multi-line objects/arrays

### Component Structure

```typescript
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types/Interfaces
interface Props {
  name: string
}

// 3. Component
export function MyComponent({ name }: Props) {
  // 4. Hooks
  const [state, setState] = useState('')

  // 5. Event handlers
  const handleClick = () => {
    // ...
  }

  // 6. Render
  return (
    <div>
      <Button onClick={handleClick}>{name}</Button>
    </div>
  )
}
```

### Documentation

- Use JSDoc for function documentation
- Include examples for complex functions
- Keep README.md up to date
- Document breaking changes

```typescript
/**
 * Validates if marked cells match the pattern
 * @param markedCells - Array of cell indices (0-24)
 * @param pattern - Pattern to validate against
 * @returns true if pattern matches
 * @example
 * validatePattern([0,1,2,3,4], singleLinePattern) // true
 */
function validatePattern(markedCells: number[], pattern: Pattern): boolean {
  // ...
}
```

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code contributions

### Getting Help

- Check existing documentation first
- Search closed issues
- Ask in GitHub Discussions
- Be patient and respectful

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Bingo Caller 3000!** 🎯

Every contribution, no matter how small, helps make this project better for everyone.
