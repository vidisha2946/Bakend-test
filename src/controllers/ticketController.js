const pool = require('../database/connection');

const STATUS_TRANSITIONS = {
    OPEN: ['IN_PROGRESS'],
    IN_PROGRESS: ['RESOLVED'],
    RESOLVED: ['CLOSED'],
    CLOSED: [],
};

const userJoin = (alias, col) => `
    ${alias}.id         AS ${col}_id,
    ${alias}.name       AS ${col}_name,
    ${alias}.email      AS ${col}_email,
    ${alias}.created_at AS ${col}_created_at,
    r${alias}.id        AS ${col}_role_id,
    r${alias}.name      AS ${col}_role_name
`;

const TICKET_SELECT = `
    SELECT
        t.id, t.title, t.description, t.status, t.priority, t.created_at,
        ${userJoin('cb', 'created_by')},
        ${userJoin('at', 'assigned_to')}
    FROM tickets t
    JOIN users cb  ON cb.id  = t.created_by
    JOIN roles rcb ON rcb.id = cb.role_id
    LEFT JOIN users at  ON at.id  = t.assigned_to
    LEFT JOIN roles rat ON rat.id = at.role_id
`;

const formatTicket = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    created_by: {
        id: row.created_by_id,
        name: row.created_by_name,
        email: row.created_by_email,
        role: { id: row.created_by_role_id, name: row.created_by_role_name },
        created_at: row.created_by_created_at,
    },
    assigned_to: row.assigned_to_id
        ? {
            id: row.assigned_to_id,
            name: row.assigned_to_name,
            email: row.assigned_to_email,
            role: { id: row.assigned_to_role_id, name: row.assigned_to_role_name },
            created_at: row.assigned_to_created_at,
        }
        : null,
    created_at: row.created_at,
});

const getTicketById = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const role = req.user.role.name;

        const [rows] = await pool.query(TICKET_SELECT + ' WHERE t.id = ?', [ticketId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const ticket = rows[0];

        if (role === 'SUPPORT' && ticket.assigned_to_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied: ticket is not assigned to you' });
        }
        if (role === 'USER' && ticket.created_by_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied: this is not your ticket' });
        }

        return res.json(formatTicket(ticket));
    } catch (err) {
        console.log('getTicketById error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const createTicket = async (req, res) => {
    try {
        const { title, description, priority } = req.body;

        const [result] = await pool.query(
            'INSERT INTO tickets (title, description, priority, created_by) VALUES (?, ?, ?, ?)',
            [title, description, priority, req.user.id]
        );

        const [rows] = await pool.query(TICKET_SELECT + ' WHERE t.id = ?', [result.insertId]);
        return res.status(201).json(formatTicket(rows[0]));
    } catch (err) {
        console.log('createTicket error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const listTickets = async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 20 } = req.query;
        const role = req.user.role.name;

        let where = [];
        let params = [];

        if (role === 'SUPPORT') {
            where.push('t.assigned_to = ?');
            params.push(req.user.id);
        } else if (role === 'USER') {
            where.push('t.created_by = ?');
            params.push(req.user.id);
        }

        if (status) { where.push('t.status = ?'); params.push(status); }
        if (priority) { where.push('t.priority = ?'); params.push(priority); }

        const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const sql = TICKET_SELECT + whereClause + ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [rows] = await pool.query(sql, params);
        return res.json(rows.map(formatTicket));
    } catch (err) {
        console.log('listTickets error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const assignTicket = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const { userId } = req.body;

        const [ticketRows] = await pool.query('SELECT id FROM tickets WHERE id = ?', [ticketId]);
        if (ticketRows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const [userRows] = await pool.query(
            `SELECT u.id, r.name AS role_name
             FROM users u JOIN roles r ON r.id = u.role_id
             WHERE u.id = ?`,
            [userId]
        );
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (userRows[0].role_name === 'USER') {
            return res.status(400).json({ message: 'Tickets cannot be assigned to users with role USER' });
        }

        await pool.query('UPDATE tickets SET assigned_to = ? WHERE id = ?', [userId, ticketId]);

        const [rows] = await pool.query(TICKET_SELECT + ' WHERE t.id = ?', [ticketId]);
        return res.json(formatTicket(rows[0]));
    } catch (err) {
        console.log('assignTicket error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateStatus = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const { status: newStatus } = req.body;

        const [ticketRows] = await pool.query('SELECT id, status FROM tickets WHERE id = ?', [ticketId]);
        if (ticketRows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const oldStatus = ticketRows[0].status;

        if (oldStatus === newStatus) {
            return res.status(400).json({ message: `Ticket is already in status '${oldStatus}'` });
        }

        const allowed = STATUS_TRANSITIONS[oldStatus] || [];
        if (!allowed.includes(newStatus)) {
            return res.status(400).json({
                message: `Invalid status transition: '${oldStatus}' to '${newStatus}'. Allowed: ${allowed.length ? allowed.join(', ') : 'none (ticket is CLOSED)'}`,
            });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query('UPDATE tickets SET status = ? WHERE id = ?', [newStatus, ticketId]);
            await conn.query(
                'INSERT INTO ticket_status_logs (ticket_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)',
                [ticketId, oldStatus, newStatus, req.user.id]
            );
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }

        const [rows] = await pool.query(TICKET_SELECT + ' WHERE t.id = ?', [ticketId]);
        return res.json(formatTicket(rows[0]));
    } catch (err) {
        console.log('updateStatus error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteTicket = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);

        const [rows] = await pool.query('SELECT id FROM tickets WHERE id = ?', [ticketId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        await pool.query('DELETE FROM tickets WHERE id = ?', [ticketId]);
        return res.status(204).send();
    } catch (err) {
        console.log('deleteTicket error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getTicketById, createTicket, listTickets, assignTicket, updateStatus, deleteTicket };
