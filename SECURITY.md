# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.5.x   | :white_check_mark: |
| 0.4.x   | :white_check_mark: |
| < 0.4   | :x:                |

## Reporting a Vulnerability

The Gravitate Health team and community take security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send an email to the Gravitate Health security team
   - Include detailed information about the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Suggested fixes (if any)

2. **GitHub Security Advisory**: Use GitHub's [private vulnerability reporting](https://github.com/Gravitate-Health/lens-tool-bundler/security/advisories/new)

### What to Include

Please include the following information in your report:

- Type of issue (e.g., code injection, dependency vulnerability, authentication bypass)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Status Updates**: We will keep you informed about our progress
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days

### Disclosure Policy

- We will coordinate public disclosure with you
- Security advisories will be published after patches are released
- You will be credited for the discovery (unless you prefer to remain anonymous)

## Security Update Process

1. Security vulnerabilities are fixed in a private branch
2. Patches are tested thoroughly
3. A new version is released with security fixes
4. Security advisory is published with details
5. Users are notified through:
   - GitHub Security Advisories
   - npm package updates
   - Repository announcements

## Security Best Practices

When using Lens Tool Bundler:

### For Users

- **Keep Updated**: Always use the latest version
- **Verify Sources**: Only install from official npm registry
- **Review Dependencies**: Check for vulnerable dependencies regularly
- **Secure Credentials**: Never commit FHIR server credentials
- **Environment Variables**: Use environment variables for sensitive data

### For Developers

- **Input Validation**: Validate all user inputs
- **Dependency Audits**: Run `npm audit` regularly
- **Code Review**: Review all code changes for security implications
- **Secrets Management**: Never commit API keys, passwords, or tokens
- **Safe Defaults**: Use secure defaults in configuration

## Known Security Considerations

### FHIR Server Communication

- Always use HTTPS for FHIR server connections
- Implement proper authentication (OAuth2, Bearer tokens)
- Validate server certificates
- Use rate limiting to prevent abuse

### Lens Execution

- Lenses execute JavaScript code - review before deployment
- Validate lens sources before bundling
- Test lenses in isolated environments first
- Monitor lens execution for unexpected behavior

### File Operations

- Validate file paths to prevent directory traversal
- Check file permissions before operations
- Sanitize user-provided filenames
- Use temporary directories with proper permissions

## Dependencies

We use Dependabot to monitor dependencies for security vulnerabilities:
- Automatic pull requests for security updates
- Weekly checks for new vulnerabilities
- npm audit in CI/CD pipeline

### Current Known Dependency Vulnerabilities (v0.5.1)

As of February 2026, the project has the following known vulnerabilities that are **not exploitable** in this CLI tool's context:

#### 1. Bundled npm Dependencies (50 vulnerabilities)
These vulnerabilities exist in npm's bundled dependencies (node_modules/npm/):
- **brace-expansion**: RegEx DoS vulnerability
- **diff**: DoS vulnerability in parsePatch/applyPatch
- **glob**: Command injection via CLI
- **tar**: Path traversal vulnerabilities
- **cacache, make-fetch-happen, pacote, sigstore**: Dependent vulnerabilities

**Status**: ✅ **Not Exploitable**
- These are bundled within npm itself (not directly used by our code)
- Cannot be fixed without updating npm globally
- Do not affect the security of lens-tool-bundler operations
- Require npm maintainers to release updates

#### 2. AWS SDK Dependencies (1 vulnerability)
The oclif framework (v4.22.73) includes AWS SDK packages for plugin marketplace features:
- **fast-xml-parser**: RangeError DoS vulnerability (affects @aws-sdk/xml-builder)

**Status**: ✅ **Not Exploitable**
- Only used by oclif for plugin marketplace features (not used by lens-tool-bundler)
- Requires Node.js ≥20.0.0 (project currently supports Node.js ≥18.0.0)
- AWS SDK team is actively addressing this issue
- Does not affect core lens bundling, testing, or deployment functionality

#### Mitigation Strategy
1. **Regular Updates**: We monitor and update dependencies as fixes become available
2. **Minimal Attack Surface**: The CLI tool does not expose network services or user inputs that could trigger these vulnerabilities
3. **Sandboxed Execution**: Lens validation and testing run in isolated contexts
4. **User Awareness**: Users should follow security best practices (see above)

#### Future Plans
- Upgrade to Node.js ≥20.0.0 when project dependencies are fully compatible
- Continue monitoring for upstream fixes from npm and AWS SDK maintainers
- Remove or replace dependencies if vulnerabilities become exploitable

**Note**: These vulnerabilities are tracked in npm audit reports. Run `npm audit` to see the full details. We assess all reported vulnerabilities and prioritize fixes based on actual risk to users.

## Compliance

This project handles healthcare-related data. Ensure compliance with:
- GDPR (General Data Protection Regulation)
- HIPAA (if applicable in your region)
- Local data protection regulations

## Contact

For security concerns, contact:
- Universidad Politécnica de Madrid (UPM)
- Gravitate Health Project Team

## Acknowledgments

We thank the security research community for their contributions to keeping our project secure.

---

**Last Updated**: February 2026
