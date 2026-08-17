---
id: password-and-session-contract
title: Password and Session Contract
sidebar_label: Password and Session
sidebar_position: 1
description: The PATCH /me/password rules and how User.sessionVersion invalidates older tokens with 401 SESSION_INVALIDATED.
---

# Password and session contract

Authenticated users can change their password with `PATCH /me/password` by
providing `currentPassword`, `newPassword`, and `confirmation`.

- New passwords contain 8-128 characters and must differ from the current
  password.
- A successful change increments `User.sessionVersion` and returns a new JWT
  for the current browser.
- The web client replaces its stored token with that JWT. Every token issued
  with an older version, including legacy version-less tokens, then receives
  `401 SESSION_INVALIDATED`.
- Password hashes and session versions are never included in public user or
  password-change responses.

Stable failure codes are `CURRENT_PASSWORD_INVALID`,
`PASSWORD_CONFIRMATION_MISMATCH`, `PASSWORD_LENGTH_INVALID`, and
`PASSWORD_REUSE_FORBIDDEN`.
