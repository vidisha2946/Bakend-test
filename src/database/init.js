const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_NAME = process.env.DB_NAME || 'ticket_management';

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log('Initializing database...');

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.query(`USE \`${DB_NAME}\``);
    console.log('Database ready');

    await connection.query(`
            CREATE TABLE IF NOT EXISTS roles (
                id   INT NOT NULL AUTO_INCREMENT,
                name ENUM('MANAGER','SUPPORT','USER') NOT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY uk_roles_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    await connection.query(`INSERT IGNORE INTO roles (name) VALUES ('MANAGER'), ('SUPPORT'), ('USER')`);
    console.log('Roles table ready');

    await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id         INT          NOT NULL AUTO_INCREMENT,
                name       VARCHAR(255) NOT NULL,
                email      VARCHAR(255) NOT NULL,
                password   VARCHAR(255) NOT NULL,
                role_id    INT          NOT NULL,
                created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uk_users_email (email),
                CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    console.log('Users table ready');

    await connection.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id          INT          NOT NULL AUTO_INCREMENT,
                title       VARCHAR(255) NOT NULL,
                description TEXT         NOT NULL,
                status      ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
                priority    ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
                created_by  INT          NOT NULL,
                assigned_to INT          NULL,
                created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                CONSTRAINT fk_tickets_created_by  FOREIGN KEY (created_by)  REFERENCES users(id),
                CONSTRAINT fk_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    console.log('Tickets table ready');

    await connection.query(`
            CREATE TABLE IF NOT EXISTS ticket_comments (
                id         INT       NOT NULL AUTO_INCREMENT,
                ticket_id  INT       NOT NULL,
                user_id    INT       NOT NULL,
                comment    TEXT      NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
                CONSTRAINT fk_comments_user   FOREIGN KEY (user_id)   REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    console.log('Ticket comments table ready');

    await connection.query(`
            CREATE TABLE IF NOT EXISTS ticket_status_logs (
                id         INT       NOT NULL AUTO_INCREMENT,
                ticket_id  INT       NOT NULL,
                old_status ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL,
                new_status ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL,
                changed_by INT       NOT NULL,
                changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                CONSTRAINT fk_logs_ticket     FOREIGN KEY (ticket_id)  REFERENCES tickets(id) ON DELETE CASCADE,
                CONSTRAINT fk_logs_changed_by FOREIGN KEY (changed_by) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    console.log('Ticket status logs table ready');

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@company.com']);
    if (existing.length === 0) {
      const hash = await bcrypt.hash('Admin@123', 10);
      const [roleRow] = await connection.query("SELECT id FROM roles WHERE name = 'MANAGER'");
      await connection.query(
        'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
        ['Admin Manager', 'admin@company.com', hash, roleRow[0].id]
      );
      console.log('Default MANAGER created: admin@company.com / Admin@123');
    } else {
      console.log('Default MANAGER already exists');
    }

    console.log('Database initialization complete');
  } finally {
    await connection.end();
  }
}

initDatabase().catch(err => {
  console.log('Init failed: ' + err.message);
  process.exit(1);
});
