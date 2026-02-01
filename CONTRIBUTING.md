# Contributing to Lens Tool Bundler

Thank you for your interest in contributing to the Lens Tool Bundler! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/lens-tool-bundler.git
   cd lens-tool-bundler
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/Gravitate-Health/lens-tool-bundler.git
   ```

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

### Development Workflow

```bash
# Run in development mode with ts-node
./bin/dev.js COMMAND

# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Making Changes

### Branch Naming

Use descriptive branch names following these patterns:
- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions or changes
- `chore/description` - Maintenance tasks

Example: `feat/add-validation-command`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(new): add template cloning support

- Add --template flag to clone full repository
- Support forking with --fork flag
- Detect empty directories for in-place creation

Closes #123
```

```
fix(upload): correct FHIR Content-Type header

Changed from application/json to application/fhir+json
for proper FHIR R4 compliance.
```

## Submitting Changes

1. **Update your fork**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a pull request**:
   - Push your changes to your fork
   - Open a PR against the `main` branch
   - Fill out the PR template completely
   - Link any related issues

3. **PR Requirements**:
   - ✅ All tests pass
   - ✅ Code follows style guidelines
   - ✅ Documentation updated (if needed)
   - ✅ CHANGELOG.md updated
   - ✅ Commits follow conventional format

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Add proper types (avoid `any`)
- Use ES modules with `.js` extensions in imports

### Style

- Follow existing code style
- Use ESLint configuration provided
- Run `npm run lint` before committing
- Use Prettier for formatting

### File Organization

```
src/
├── commands/     # oclif command handlers
├── controllers/  # Business logic
└── models/       # Data models (FHIR resources)
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.ts
```

### Writing Tests

- Place tests in the `test/` directory
- Mirror the `src/` structure
- Use descriptive test names
- Test both success and error cases

Example:
```typescript
describe('bundle command', () => {
  it('should create FHIR Library from JS file', async () => {
    // Test implementation
  });

  it('should handle missing files gracefully', async () => {
    // Test implementation
  });
});
```

## Documentation

### README Updates

- Update command examples when adding features
- Keep installation instructions current
- Add new flags to usage documentation

### Code Comments

- Use JSDoc for functions and classes
- Explain "why" not "what"
- Keep comments up to date

### CHANGELOG

Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/):
- Add entries under `[Unreleased]` section
- Use Added, Changed, Deprecated, Removed, Fixed, Security categories
- Include issue/PR references

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Contact the maintainers: Universidad Politécnica de Madrid (UPM)

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

Thank you for contributing to Gravitate Health! 🚀
