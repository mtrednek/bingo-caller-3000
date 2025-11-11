# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Bingo Caller 3000 seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **admin@snowymountainsoftware.com**

Include the following details:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: Within 7 days
  - High: Within 30 days
  - Medium: Within 90 days
  - Low: Next release cycle

## Security Best Practices

### Before Deployment

#### 1. Change Default Credentials

**CRITICAL**: Never use default passwords in production!

```bash
# Generate secure passwords
openssl rand -base64 32

# Set in .env file
ADMIN_PASSWORD="your-secure-random-password"
NEXTAUTH_SECRET="your-secure-random-secret"
```

#### 2. Environment Variables

Create a production `.env` file with secure values:

```env
# Never use these defaults in production!
DATABASE_URL="postgresql://user:password@localhost:5432/bingo_prod"
NEXTAUTH_SECRET="<generated-with-openssl-rand>"
NEXTAUTH_URL="https://yourdomain.com"
ADMIN_PASSWORD="<secure-password>"
```

#### 3. Database Security

- Use PostgreSQL or MySQL in production (not SQLite)
- Enable SSL/TLS for database connections
- Use separate database users with minimal privileges
- Enable database backups
- Implement database encryption at rest

#### 4. Network Security

- Enable HTTPS/SSL (Let's Encrypt certificates)
- Configure firewall rules
- Use secure headers (HSTS, CSP, etc.)
- Implement rate limiting
- Enable DDoS protection

### Application Security

#### 1. Authentication

- Session timeout: 24 hours (configurable)
- Password minimum: 8 characters
- Bcrypt hashing with 10 salt rounds
- CSRF protection enabled
- Secure cookie flags (httpOnly, secure, sameSite)

#### 2. Authorization

Role-based access control:
- **Admin**: Full system access
- **Caller**: Game management only
- **Viewer**: Read-only access

#### 3. Input Validation

All user inputs are validated:
- Session names: Max 100 characters
- Player counts: 1-1000
- Prize values: Positive numbers
- Passwords: Min 8 characters

#### 4. API Security

- Authentication required for all endpoints
- Rate limiting on authentication endpoints
- Input sanitization
- SQL injection prevention (Prisma ORM)
- XSS prevention (React escaping)

### Known Security Considerations

#### 1. SQLite Limitations

SQLite is suitable for development but has limitations in production:
- Single-writer concurrency
- No user management
- File-based permissions only

**Recommendation**: Use PostgreSQL or MySQL for production deployments.

#### 2. Session Storage

NextAuth.js uses JWT tokens by default. For enhanced security:
- Set short token expiration
- Implement token refresh
- Consider database session storage

#### 3. Real-time Communications

Socket.IO connections should:
- Verify session authentication
- Validate all incoming messages
- Rate limit connections
- Implement connection timeouts

### Security Headers

Recommended security headers for production:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### Regular Security Maintenance

#### Monthly Tasks
- [ ] Review user accounts
- [ ] Check for unauthorized access
- [ ] Review system logs
- [ ] Update dependencies
- [ ] Test backups

#### Quarterly Tasks
- [ ] Security audit
- [ ] Penetration testing
- [ ] Review and rotate secrets
- [ ] Update documentation
- [ ] Security training

#### Yearly Tasks
- [ ] Comprehensive security review
- [ ] Third-party security assessment
- [ ] Disaster recovery testing
- [ ] Compliance review

### Dependency Security

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Check outdated packages
npm outdated
```

### Secure Deployment Checklist

- [ ] All default passwords changed
- [ ] `NEXTAUTH_SECRET` set to secure random value
- [ ] `.env` file not committed to version control
- [ ] Database using production-grade system (PostgreSQL/MySQL)
- [ ] HTTPS/SSL enabled
- [ ] Firewall configured
- [ ] Security headers implemented
- [ ] Rate limiting enabled
- [ ] Backups configured
- [ ] Monitoring and logging enabled
- [ ] Error messages don't expose sensitive info
- [ ] Dependencies up to date
- [ ] Security audit completed
- [ ] Incident response plan documented

### Incident Response

If you suspect a security breach:

1. **Immediate Actions**
   - Take affected systems offline if necessary
   - Document everything
   - Preserve evidence
   - Contact security team

2. **Assessment**
   - Determine scope of breach
   - Identify compromised data
   - Assess impact

3. **Containment**
   - Change all passwords
   - Revoke compromised sessions
   - Patch vulnerabilities

4. **Recovery**
   - Restore from clean backups
   - Verify system integrity
   - Monitor for recurrence

5. **Post-Incident**
   - Document lessons learned
   - Update security measures
   - Notify affected parties if required

### Compliance

This application may need to comply with:
- GDPR (if serving EU users)
- CCPA (if serving California residents)
- Local gambling/gaming regulations
- Data protection laws

Consult with legal counsel for your specific use case.

### Security Contact

- **Email**: admin@snowymountainsoftware.com
- **PGP Key**: Available on request
- **Response Time**: Within 48 hours

### Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#security)

---

**Last Updated**: 2025
**Version**: 1.0.0
