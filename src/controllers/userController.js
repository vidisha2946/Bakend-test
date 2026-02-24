const bcrypt = require('bcryptjs');
const pool = require('../database/connection');

const USER_SELECT = `
    SELECT u.id, u.name, u.email, u.created_at,
           r.id AS role_id, r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
`;

const formatUser = (row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: { id: row.role_id, name: row.role_name },
    created_at: row.created_at,
});

const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ?', [role]);
        if (roleRows.length === 0) {
            return res.status(400).json({ message: `Invalid role: ${role}` });
        }

        const hash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
            [name, email, hash, roleRows[0].id]
        );

        const [newUser] = await pool.query(USER_SELECT + ' WHERE u.id = ?', [result.insertId]);
        return res.status(201).json(formatUser(newUser[0]));
    } catch (err) {
        console.log('createUser error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const listUsers = async (req, res) => {
    try {
        const [rows] = await pool.query(USER_SELECT + ' ORDER BY u.created_at DESC');
        return res.json(rows.map(formatUser));
    } catch (err) {
        console.log('listUsers error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { createUser, listUsers };
