const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await pool.query(
            `SELECT u.id, u.name, u.email, u.password, u.created_at,
                    r.id AS role_id, r.name AS role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const payload = { id: user.id, email: user.email, role: user.role_name };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        });

        return res.json({ token });
    } catch (err) {
        console.log('Login error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { login };
