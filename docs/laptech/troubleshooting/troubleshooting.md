---
id: troubleshooting
title: Troubleshooting and FAQ
sidebar_label: Troubleshooting
sidebar_position: 1
description: Common issues and solutions
---

### FAQ

- **Q: Email already in use?** A: Check for duplicates in DB; use unique constraints.
- **Q: Token expired?** A: Refresh using /refresh-token endpoint.
- **Q: Cookie not set?** A: Ensure HTTPS in production; check browser console.

### Common Errors

- **DuplicateResourceException**: Email exists during registration.
- **TokenRefreshException**: Invalid or expired refresh token.
- **ResourceNotFoundException**: User/role not found.

### Debugging Tips

- Enable Spring Security debug logs: `logging.level.org.springframework.security=DEBUG`.
- Inspect DB tables for refresh_tokens to verify storage.
