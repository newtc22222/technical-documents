---
id: examples
title: Usage Examples
sidebar_label: Examples
description: Code and API usage examples.
---

### Register User (cURL)

```bash
curl -X POST <http://localhost:8080/api/auth/register>
-H "Content-Type: application/json"
-d '{"email": "<user@example.com>", "name": "John Doe", "password": "StrongPass123!", "gender": "MALE"}'
```

### Login (cURL)

```bash
curl -X POST <http://localhost:8080/api/auth/login>
-H "Content-Type: application/json"
-d '{"email": "<user@example.com>", "password": "StrongPass123!"}'
--cookie-jar cookies.txt
```

### Refresh Token

Use the cookie from login:

```bash
curl -X POST <http://localhost:8080/api/auth/refresh-token>
--cookie cookies.txt --cookie-jar cookies.txt
```
