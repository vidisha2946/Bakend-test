const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [rows] = await pool.query(
            `SELECT u.id, u.name, u.email, u.created_at,
                    r.id AS role_id, r.name AS role_name
             FROM users u
             JOIN roles r ON r.id = u.role_id
             WHERE u.id = ?`,
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        req.user = {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            created_at: rows[0].created_at,
            role: { id: rows[0].role_id, name: rows[0].role_name },
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        if (!roles.includes(req.user.role.name)) {
            return res.status(403).json({
                message: `Access denied. Required role(s): ${roles.join(', ')}`,
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
