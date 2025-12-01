# Task Platform – Secured REST API with JWT & API Gateway

This repository contains a **working example** of how to secure a **REST API** in a **microservice architecture** using:

- **JWT (JSON Web Tokens)** for authentication
- An **API Gateway** for centralised security and routing
- A **Task Service** that enforces **per-user data isolation**

The project is used as the implementation example for a university assignment tutorial on **securing a REST API** with a real, runnable system.

---

## 🎯 Tutorial Focus: Securing `/api/tasks`

The tutorial and this repo focus on one concrete flow:

1. A user logs in via **Auth Service** and receives a **JWT**.
2. The browser stores the token and calls **`/api/tasks`** through the **API Gateway**.
3. The API Gateway validates the token and forwards the request to **Task Service** with `x-user-id` set.
4. Task Service uses `x-user-id` to return **only the tasks belonging to that user** from Postgres.

This illustrates three core security concepts:

- **Authentication** – checking who the user is (via Auth Service and JWT).
- **Centralised verification** – API Gateway validates tokens on all protected routes.
- **Authorisation** – Task Service enforces that each user only sees and modifies their own tasks.

The detailed explanation is in:

- `docs/tutorial-securing-api-tasks-focused.docx`

---

## 🧱 Architecture Overview

### Frontends

- **`web-shell`** – React SPA for end users:
  - Register & login
  - Create, edit, delete tasks
  - View live notifications (Server-Sent Events)
- **`web-admin`** – React SPA for admin / monitoring:
  - View registered users
  - View tasks and simple analytics
  - See FaaS-based statistics (aggregated task info)
  - See Kafka / RabbitMQ related information

### Edge / Routing

- **`nginx`**
  - Serves built frontend bundles:
    - `/` → Web Shell SPA
    - `/admin/` → Admin SPA
  - Forwards `/api/*` → **API Gateway** (load-balanced between two instances)
  - Forwards `/notifications/stream` → **Notification Service** for SSE

- **`api-gateway`**
  - Public entrypoint for **all** backend APIs
  - Exposes `/api/auth/*`, `/api/tasks`, `/api/admin/*`, `/api/faas/*`, `/api/notifications/*`
  - Validates JWT tokens on protected routes
  - Forwards `x-user-id` to downstream services

### Backend Microservices

- **`auth-service`**
  - Endpoints:
    - `POST /auth/register` → exposed as `POST /api/auth/register`
    - `POST /auth/login` → exposed as `POST /api/auth/login`
    - `GET /auth/me`
    - `GET /auth/admin/users` (for admin UI)
  - Uses Postgres `users` table:
    - `id`, `email`, `password_hash`
  - Hashes passwords with **bcrypt**
  - Issues **JWT** on successful login

- **`task-service`**
  - Endpoints: `GET/POST/PUT/DELETE /api/tasks` (behind gateway)
  - Uses Postgres `tasks` table:
    - `id`, `user_id`, `title`, `completed`
  - Enforces per-user access by filtering by `user_id`
  - Emits internal HTTP events to Notification Service for SSE
  - Publishes events to Kafka topic `task-events`

- **`notification-service`**
  - `GET /notifications/stream` – Server-Sent Events for live updates in the frontend
  - `POST /internal/task-event` – internal endpoint called by Task Service to broadcast events
  - `POST /notifications/send-email` – publishes jobs to RabbitMQ `email_queue`

- **`email-worker`**
  - Background process consuming RabbitMQ `email_queue`
  - Simulates sending emails (logs to console)

- **`faas-service`**
  - Example Function-as-a-Service style microservice
  - Exposes `POST /analyze-tasks`
  - Receives a list of tasks, returns:
    - total tasks
    - completed / pending
    - completion rate
    - uppercase versions of titles
  - Called through API Gateway as `/api/faas/overview-stats` from Admin UI

- **`task-events-consumer`**
  - Consumes events from Kafka `task-events` topic
  - Logs newly created / updated / deleted tasks
  - Demonstrates **event streaming**

### Infrastructure

- **`postgres`**
  - Persists:
    - Users (`users` table)
    - Tasks (`tasks` table)
- **`rabbitmq`**
  - Broker for email jobs (`email_queue`)
- **`kafka` + `zookeeper`**
  - Event streaming for task events (`task-events`)

Everything is wired together via **`docker-compose.yml`**.

---

## 🔐 What is REST in this project?

This project exposes several **REST APIs**, but the main one for the tutorial is:

> `GET /api/tasks`

**REST** (Representational State Transfer) is an architectural style for web APIs based on:

1. **Resources**
   - Things in the system are modelled as resources with URLs.
   - Example: `tasks` → `/api/tasks`, `/api/tasks/1`.

2. **HTTP methods**
   - Standard verbs represent actions:
     - `GET` → read
     - `POST` → create
     - `PUT` → update
     - `DELETE` → delete

3. **Statelessness**
   - Each request contains all information needed.
   - The server does **not** keep session state.
   - In this project: authentication state is carried in each request via
     - `Authorization: Bearer <JWT>`.

4. **Representations**
   - Resources are usually represented as JSON objects.
   - Example task:
     ```json
     {
       "id": 2,
       "title": "My first task",
       "completed": false
     }
     ```

5. **Uniform interface**
   - Consistent URLs + HTTP verbs + status codes (200, 201, 400, 401, 404, etc.).

In this system:

- `/api/tasks` is a REST endpoint for the **Tasks resource**.
- It is **secured** with **JWT** via the API Gateway.
- **Task Service** applies authorisation rules using the `user_id` stored in the database.

---

## 🚀 How to Run

### Prerequisites

- Docker
- docker-compose

### 1. Clone the repo

```bash
git clone https://github.com/psabau/task-platform.git
cd task-platform
```

### 2. Start the stack

```bash
docker-compose up --build
```

This will start:

- Postgres
- RabbitMQ
- Kafka + Zookeeper
- All Node.js microservices
- React apps
- Nginx on port **8080**

### 3. Web Shell – User UI

Open:

```text
http://localhost:8080/
```

Flow:

1. **Register** a new user (Register page → `/api/auth/register`).
2. **Login** with the same account (`/api/auth/login`, receives JWT).
3. Navigate to **Tasks**:
   - Create tasks (POST `/api/tasks`)
   - Edit / delete tasks (PUT/DELETE `/api/tasks/:id`)
4. Check the **Notifications** page for live SSE events when tasks change.

Try calling `/api/tasks` without the `Authorization` header (e.g. via Postman) → should return **401 Unauthorized**.

### 4. Web Admin – Admin UI

Open:

```text
http://localhost:8080/admin/
```

Admin UI uses:

- `/api/admin/users` – list of users
- `/api/tasks` – task list
- `/api/faas/overview-stats` – statistics computed by FaaS service

---

## 📁 Folder Structure (simplified)

```text
.
├─ api-gateway/          # JWT verification, routing, /api/*
├─ auth-service/         # User registration / login, JWT issuing
├─ task-service/         # Tasks CRUD per user, Postgres, Kafka, SSE events
├─ notification-service/ # SSE stream + RabbitMQ email producer
├─ email-worker/         # RabbitMQ consumer
├─ faas-service/         # Example FaaS endpoint (/analyze-tasks)
├─ task-events-consumer/ # Kafka consumer
├─ web-shell/            # React SPA (main user UI)
├─ web-admin/            # React SPA (admin UI)
├─ nginx/                # nginx.conf
└─ docker-compose.yml
```



