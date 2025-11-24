---
id: improvements
title: Proposed Improvements
sidebar_label: Improvements
sidebar_position: 2
description: Suggestions for enhancing the module.
---

### Architecture

- Implement OAuth2 integration for social logins.
- Add rate limiting on auth endpoints to prevent brute-force attacks.

### Code Quality

- Complete TODOs: forgot-password, reset-password, logout-all.
- Use optional chaining more consistently.
- Add unit/integration tests for service and controller.

### Developer Experience (DX)

- Generate OpenAPI docs with Springdoc.
- Use environment-specific profiles for cookie security.

### Security

- Implement multi-factor authentication (MFA).
- Audit for OWASP top 10 vulnerabilities.
- Rotate JWT secrets periodically.
