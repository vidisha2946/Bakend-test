const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ticket_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.getConnection()
    .then(conn => {
        console.log('MySQL connected successfully');
        conn.release();
    })
    .catch(err => {
        console.log('MySQL connection failed: ' + err.message);
        process.exit(1);
    });

module.exports = pool;
