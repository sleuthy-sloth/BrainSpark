# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | ✅ Active development |

## Reporting a Vulnerability

NeuralPulse is a brain training web app that runs primarily client-side. While we take security seriously, the app does not handle sensitive financial or medical data.

**Please do not file public issues for security vulnerabilities.**

To report a security issue, email **spkoehl@gmail.com** with:

- A description of the vulnerability
- Steps to reproduce
- Potential impact

You can expect:

- **Acknowledgement** within 48 hours
- **Status update** within 5 business days
- **Disclosure coordination** — we'll work with you on timing

## Scope

NeuralPulse uses Supabase for optional auth sync. Supabase-related security concerns should be reported to Supabase directly. For the client-side app, we're primarily concerned with:

- XSS or injection through game data
- Auth token mishandling
- Storage of personal data in IndexedDB
