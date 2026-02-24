# Support Ticket Management System

A RESTful backend API for managing support tickets, built with Node.js, Express.js, and MySQL.

---

## Tech Stack

- **Framework**: Express.js
- **Database**: MySQL (mysql2)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Other**: cors, helmet, morgan, dotenv

---

## Setup & Installation

### Prerequisites

- Node.js (v16 or above)
- MySQL (running locally)

### Steps

**1. Clone the repository**
```bash
git clone <your-repo-url>
cd TicketManagementSystem
```

**2. Install dependencies**
```bash
npm install
```

**3. Update `.env` with your MySQL password**
```
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ticket_management

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h
```

**4. Initialize the database**
```bash
npm run db:init
```
This creates the database, all tables, and a default MANAGER account.

**5. Start the server**
```bash
npm run dev
```

Server runs at: `http://localhost:3000`

---

## Default Login

| Field    | Value                  |
|----------|------------------------|
| Email    | admin@company.com      |
| Password | Admin@123              |
| Role     | MANAGER                |

---


## Ticket Status Lifecycle

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
```

- Transitions are forward-only
- Skipping steps is not allowed (e.g. OPEN → CLOSED will be rejected)
- Same-status update is not allowed
- Every status change is recorded in the `ticket_status_logs` table

---

## API Endpoints

### Auth
| Method | Endpoint      | Access  | Description |
|--------|---------------|---------|-------------|
| POST   | /auth/login   | Public  | Login and get JWT token |

### Users
| Method | Endpoint | Access  | Description |
|--------|----------|---------|-------------|
| POST   | /users   | MANAGER | Create a new user |
| GET    | /users   | MANAGER | List all users |

### Tickets
| Method | Endpoint               | Access           | Description |
|--------|------------------------|------------------|-------------|
| POST   | /tickets               | USER, MANAGER    | Create ticket |
| GET    | /tickets               | All (filtered)   | List tickets |
| GET    | /tickets/:id           | All (filtered)   | Get single ticket |
| PATCH  | /tickets/:id/assign    | MANAGER, SUPPORT | Assign ticket |
| PATCH  | /tickets/:id/status    | MANAGER, SUPPORT | Update status |
| DELETE | /tickets/:id           | MANAGER          | Delete ticket |

### Comments
| Method | Endpoint               | Access           | Description |
|--------|------------------------|------------------|-------------|
| POST   | /tickets/:id/comments  | All              | Add comment |
| GET    | /tickets/:id/comments  | All              | List comments |
| PATCH  | /comments/:id          | Author, MANAGER  | Edit comment |
| DELETE | /comments/:id          | Author, MANAGER  | Delete comment |

---

## Validation Rules

| Field       | Rule |
|-------------|------|
| Title       | Min 5 characters, max 255 |
| Description | Min 10 characters |
| Priority    | Must be: LOW, MEDIUM, HIGH |
| Status      | Must be: OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| Password    | Min 6 characters |
| Email       | Valid email format |
| Role        | Must be: MANAGER, SUPPORT, USER |
| userId      | Positive integer, cannot be USER role |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200  | OK |
| 201  | Created |
| 204  | No Content (deleted) |
| 400  | Bad Request (validation / business rule error) |
| 401  | Unauthorized (missing or invalid token) |
| 403  | Forbidden (insufficient role) |
| 404  | Not Found |
| 500  | Internal Server Error |

---

## Scripts

| Command           | Description |
|-------------------|-------------|
| `npm run dev`     | Start with nodemon (auto-restart) |
| `npm start`       | Start in production mode |
| `npm run db:init` | Initialize database and seed default MANAGER |
#

