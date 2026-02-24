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
