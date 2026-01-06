# How to Secure a Task Manager REST API with JWT and an API Gateway

## 1. Introduction

As web applications grow, they often evolve from a single backend into a **microservice architecture**: separate services for authentication, business logic, notifications, analytics, and more. While this improves modularity and scalability, it also makes **security** more complex:

- Where do we validate tokens?
- How do we ensure each user only sees **their own data**?
- How do frontends talk to multiple services without leaking internal URLs?

This tutorial shows how to secure a **Task Manager** application built with:

- Node.js microservices
- A central **API Gateway**
- **JWT (JSON Web Tokens)** for authentication
- A React frontend
- Docker + Docker Compose

We focus on one concrete goal:

> **Only authenticated users can access `/api/tasks`, and each user can only see and modify their *own* tasks.**

---

## 2. Core Concepts

Before looking at code, let’s define the key building blocks used in the tutorial.

### 2.1 REST API

A **REST API** exposes resources over HTTP. In this system:

- **Resource**: `tasks`
- **Endpoints**:
  - `GET /api/tasks` – list tasks for the current user
  - `POST /api/tasks` – create a new task
  - `PUT /api/tasks/:id` – update a task
  - `DELETE /api/tasks/:id` – delete a task

Each endpoint uses:

- Standard HTTP verbs (GET/POST/PUT/DELETE)
- JSON request and response bodies
- Meaningful status codes (200, 201, 400, 401, 404)

### 2.2 JWT (JSON Web Tokens)

**JWT** is a compact token format used to prove identity between services, without server-side sessions.

In this app:

- The **Auth Service** issues a token at login:
  - Payload includes `userId` and `email`
- The frontend sends the token on every request:
  - `Authorization: Bearer <token>`
- The **API Gateway** verifies the token using a shared secret (`JWT_SECRET`).

If verification fails, the gateway returns **401 Unauthorized** and the request never reaches internal services.

### 2.3 API Gateway

The **API Gateway** is the single public entrypoint for all backend APIs:

- Exposed under `/api/...`
- Routes calls to internal services:
  - `/api/auth/*` → `auth-service`
  - `/api/tasks` → `task-service`
  - `/api/admin/*` → `auth-service` (admin endpoints)
  - `/api/faas/*` → `faas-service`
- Performs **JWT validation** for protected paths
- Forwards `x-user-id` to downstream services so they know who the caller is

This centralizes security and keeps internal services simpler.

### 2.4 Task Service with Per-User Isolation

The **Task Service** is responsible for CRUD operations on tasks:

- Data is stored in PostgreSQL table `tasks`
  - Columns: `id`, `user_id`, `title`, `completed`
- It uses the `x-user-id` header (set by the gateway) to:
  - Insert tasks owned by that user
  - Query only tasks belonging to that user
  - Prevent updates/deletes of tasks that are not owned by that user

This enforces **authorisation** at the data layer.

---

## 3. Example Scenario: Securing `/api/tasks`

The tutorial focuses on one concrete flow:

1. A user **registers** and **logs in** via the Auth Service.
2. The frontend receives a **JWT** and stores it in memory or `localStorage`.
3. When listing tasks, the frontend calls:
   - `GET /api/tasks`
   - With header: `Authorization: Bearer <JWT>`
4. The API Gateway:
   - Verifies the token.
   - Extracts `userId`.
   - Adds `x-user-id: <userId>` to the request.
   - Forwards to Task Service.
5. Task Service queries Postgres:
   - `SELECT * FROM tasks WHERE user_id = $1`
6. The user only sees **their own tasks**, even though the database contains tasks from many users.

---

## 4. Prerequisites

To follow this example, you should have:

- **Node.js** (v18+ recommended)
- **Docker** and **Docker Compose**
- Basic knowledge of:
  - JavaScript / Node.js
  - REST APIs
  - React (for the frontend)
- Optional: Postman or another HTTP client for testing

---

## 5. Implementation Guide

### Step 1: Auth Service – Issuing JWTs

The **Auth Service** handles registration and login. It stores users in PostgreSQL and hashes passwords with **bcrypt**.

**Key tasks:**

1. On `POST /auth/register`:
   - Check if email already exists.
   - Hash password.
   - Insert into `users (email, password_hash)`.

2. On `POST /auth/login`:
   - Find user by email.
   - Compare password with `bcrypt.compare`.
   - If valid, issue a **JWT** containing `userId` and `email`.

Example (simplified):

```js
// auth-service/src/index.js (simplified snippet)
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// POST /auth/login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email & password required" });

  const user = await db.findUserByEmail(email);
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token });
});
