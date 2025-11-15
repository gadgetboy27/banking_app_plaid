# Security Policy

## 🚨 Security Incident Report

### Incident: Multiple API Credentials Exposed in Repository (Resolved)

**Date:** 2025-11-14
**Severity:** CRITICAL
**Status:** MITIGATED - IMMEDIATE ACTION REQUIRED

### What Happened

**CRITICAL BREACH:** A `.env` file containing production API credentials was committed to the repository and is in the public git history. Additionally, three Plaid access tokens were hardcoded in source code.

**Exposed Credentials:**

1. **Appwrite (CRITICAL - Full Admin Access)**
   - Project ID: `[REDACTED]`
   - Database ID: `[REDACTED]`
   - API Key: `[REDACTED - 256 character admin key]`
   - Collection IDs for users, banks, transactions

2. **Plaid API (HIGH)**
   - Client ID: `[REDACTED]`
   - Secret: `[REDACTED]`
   - Environment: Sandbox

3. **Dwolla API (HIGH)**
   - Key: `[REDACTED]`
   - Secret: `[REDACTED]`
   - Environment: Sandbox

4. **Hardcoded Plaid Access Tokens (in `constants/index.ts`)**
   - Three sandbox access tokens in format: `access-sandbox-[UUID]`
   - All tokens must be revoked immediately

All credentials originated from the upstream repository (adrianhajdin/banking) and were carried over during the fork.

### Remediation Steps Taken

✅ **Immediate Actions:**
1. Removed `.env` file from git tracking (committed .env file removed)
2. Removed all hardcoded tokens from source code
3. Migrated to environment variable configuration
4. Updated `.gitignore` to properly exclude `.env` files
5. Updated `.env.example` with proper token placeholders
6. Created SECURITY.md documenting incident and remediation
7. Committed security fixes to feature branch

### Required User Actions

**🔴 CRITICAL - You MUST complete these steps within 24 hours:**

#### 1. **Rotate ALL Appwrite Credentials (HIGHEST PRIORITY)**
   - ⚠️ The exposed API key has FULL ADMIN ACCESS to your database
   - Go to: https://cloud.appwrite.io/console (check your Appwrite dashboard)
   - Navigate to Settings > API Keys
   - **DELETE** the exposed API key immediately
   - Generate a NEW API key with minimal required permissions
   - Update your local `.env` file with the new key
   - **VERIFY:** Check database audit logs for unauthorized access

#### 2. **Rotate All Plaid Credentials**
   - Go to: https://dashboard.plaid.com/team/keys
   - Delete/regenerate Plaid Client ID and Secret
   - Revoke the three exposed sandbox access tokens
   - Generate new sandbox credentials
   - Update your local `.env` file

#### 3. **Rotate All Dwolla Credentials**
   - Go to: https://dashboard.dwolla.com/applications
   - Regenerate Dwolla Key and Secret
   - Update your local `.env` file

#### 4. **Audit Database Access (CRITICAL)**
   - Check Appwrite audit logs for suspicious activity
   - Review all user accounts in the database
   - Check for unauthorized transactions or data access
   - Look for timestamps outside your normal activity hours

#### 5. **Review Git History & Consider Rewriting It**
   - These credentials are PERMANENTLY in your public git history
   - Anyone who cloned your repository has access to them
   - **Recommended:** Use BFG Repo-Cleaner to purge secrets from history

   ```bash
   # Install BFG Repo-Cleaner
   brew install bfg  # macOS
   # or download from: https://rtyley.github.io/bfg-repo-cleaner/

   # Clone a fresh copy
   git clone --mirror git@github.com:gadgetboy27/banking_app_plaid.git

   # Remove .env from all history
   bfg --delete-files .env banking_app_plaid.git

   # Rewrite history
   cd banking_app_plaid.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive

   # Force push (WARNING: This rewrites public history)
   git push --force
   ```

#### 6. **Set Up New Local Environment**
   ```bash
   # Copy the example file
   cp .env.example .env

   # Add your NEW credentials to .env (NEVER commit this file!)
   # The .env file is now properly gitignored
   nano .env
   ```

#### 7. **Enable GitHub Security Features**
   - Go to: Repository Settings > Security
   - Enable: Secret scanning
   - Enable: Push protection
   - Enable: Dependabot alerts
   - Review and resolve all alerts

#### 8. **Notify Stakeholders**
   - If this app has users, assess if their data was exposed
   - Check if GDPR notification requirements apply
   - Document the incident for compliance purposes

### Prevention

**Going Forward:**
- ✅ Never commit `.env` files (now in `.gitignore`)
- ✅ Use environment variables for ALL secrets
- ✅ Review code before commits using `git diff`
- ✅ Enable GitHub secret scanning and push protection
- ✅ Use pre-commit hooks to scan for secrets

### Compliance Impact

**Plaid API Terms:**
- Access tokens must be stored securely and never committed to version control
- Exposed tokens should be revoked immediately
- This incident violates Plaid's security best practices

**Potential Risks:**
- Unauthorized access to sandbox banking data
- Possible account suspension if production tokens were exposed
- GDPR/PCI-DSS compliance violations if customer data accessed

## Reporting Security Issues

If you discover a security vulnerability, please email:
- **Email:** [Your contact email]
- **Response Time:** Within 24 hours

Please do NOT open public GitHub issues for security vulnerabilities.

## Security Best Practices

### For Developers

1. **Environment Variables**
   - Use `.env` files locally (gitignored)
   - Use platform environment variables in production (Vercel, Railway, etc.)
   - Never log or expose secrets in error messages

2. **API Keys Rotation**
   - Rotate all API keys quarterly
   - Rotate immediately after:
     - Team member departure
     - Suspected compromise
     - Any security incident

3. **Code Review**
   - Always review diffs before committing
   - Use tools like `git-secrets` or `trufflehog`
   - Enable pre-commit hooks

4. **Dependencies**
   - Regularly run `npm audit`
   - Keep dependencies updated
   - Review dependency security advisories

### For Production Deployments

1. **Vercel/Railway Environment Variables**
   ```bash
   # Set via dashboard or CLI
   vercel env add PLAID_SECRET production
   ```

2. **Secrets Management**
   - Use platform secret managers
   - Enable secret scanning
   - Use least-privilege access

3. **Monitoring**
   - Enable Sentry error tracking
   - Monitor API usage for anomalies
   - Set up alerts for failed auth attempts

## Security Checklist

Before deploying to production:

- [ ] All secrets moved to environment variables
- [ ] `.env` file is gitignored
- [ ] No secrets in git history
- [ ] Secret scanning enabled
- [ ] Sentry error tracking configured
- [ ] API rate limiting enabled
- [ ] HTTPS enforced
- [ ] Content Security Policy configured
- [ ] Dependency vulnerabilities resolved
- [ ] Authentication endpoints secured
- [ ] Input validation implemented
- [ ] SQL injection protection enabled
- [ ] XSS protection enabled
- [ ] CSRF protection enabled

## Affected Services

### Plaid
- **Dashboard:** https://dashboard.plaid.com
- **Documentation:** https://plaid.com/docs/
- **Support:** support@plaid.com

### Dwolla
- **Dashboard:** https://dashboard.dwolla.com
- **Documentation:** https://developers.dwolla.com

### Appwrite
- **Console:** https://cloud.appwrite.io
- **Documentation:** https://appwrite.io/docs

### Anthropic (Claude AI)
- **Console:** https://console.anthropic.com
- **Documentation:** https://docs.anthropic.com

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Plaid Security Best Practices](https://plaid.com/docs/api/security/)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)

---

**Last Updated:** 2025-11-14
**Next Review:** 2026-02-14 (Quarterly)
