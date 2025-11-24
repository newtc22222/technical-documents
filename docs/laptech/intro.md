---
id: intro
title: Laptech Documentation
sidebar_label: Introduction
sidebar_position: 0
description: Complete documentation for the Laptech authentication module.
---

Laptech is a modern, production-ready **authentication and authorization module** built with **Spring Boot 3.x**, **JWT tokens**, and **Spring Security**. It provides secure user management, session handling, and role-based access control (RBAC).

## 🎯 What is Laptech?

Laptech is an open-source backend service that implements enterprise-grade authentication with:

- ✅ **JWT-based authentication** with access tokens
- ✅ **Secure refresh token rotation**
- ✅ **Role-based access control (RBAC)**
- ✅ **HttpOnly cookie storage** for refresh tokens
- ✅ **Full Docker support** for quick deployment
- ✅ **Environment-specific configuration** (dev, staging, prod)
- ✅ **Spring Security integration**

## 📚 Documentation Structure

Navigate through the documentation to get started:

### Overview

Understand the architecture and see planned improvements:

- **Architecture**: System design, component interactions, and data flows
- **Improvements**: Future enhancements and roadmap

### Setup & Installation

Get Laptech running locally or in Docker:

- **Installation**: Complete setup guide with system requirements
- Database and Redis configuration

### API Reference

Detailed API documentation:

- **Controllers**: HTTP endpoints and routes
- **Services**: Business logic components
- **DTOs**: Request/response data structures
- **Entities**: Database models
- **Examples**: Real-world usage examples

### Guides

Step-by-step workflows and best practices

### Troubleshooting

Common issues, FAQs, and debugging tips

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone <repo-url> laptech-api
   cd laptech-api
   ```

2. **Setup environment**

   ```bash
   cp .env.example .env
   ```

3. **Run with Docker** (recommended)

   ```bash
   docker compose up --build
   ```

4. **Access the API**
   - Swagger: `http://localhost:8080/swagger`
   - Health: `http://localhost:8080/actuator/health`

## 🔐 Key Features

| Feature | Description |
|---------|-------------|
| **JWT Authentication** | Stateless, scalable authentication |
| **Refresh Token Rotation** | Automatic token lifecycle management |
| **RBAC** | Role-based access control with Spring Security |
| **HttpOnly Cookies** | Secure refresh token storage |
| **Multi-Environment** | Dev, staging, and production profiles |
| **Docker Ready** | Pre-configured Docker Compose setup |

## 📖 Technology Stack

- **Java 21** (LTS)
- **Spring Boot 3.x** (latest)
- **Spring Security 6.x**
- **JWT (JSON Web Tokens)**
- **MySQL 8** (database)
- **Redis** (optional, for session management)
- **Docker & Docker Compose**
- **Maven 3.9+**

## 💡 Common Tasks

- Set up your development environment
- Understand the architecture
- Explore API endpoints
- View code examples
- Troubleshoot common issues

## 📞 Support & Contribution

For issues, feature requests, or contributions, please visit the repository or contact the development team.
