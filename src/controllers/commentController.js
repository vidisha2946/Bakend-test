const pool = require('../database/connection');

const COMMENT_SELECT = `
    SELECT
        tc.id, tc.comment, tc.created_at,
        u.id AS user_id, u.name AS user_name, u.email AS user_email, u.created_at AS user_created_at,
        r.id AS role_id, r.name AS role_name
    FROM ticket_comments tc
    JOIN users u ON u.id = tc.user_id
    JOIN roles r ON r.id = u.role_id
`;

const formatComment = (row) => ({
    id: row.id,
    comment: row.comment,
    user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        role: { id: row.role_id, name: row.role_name },
        created_at: row.user_created_at,
    },
    created_at: row.created_at,
});

const canAccessTicket = async (ticketId, user) => {
    const [rows] = await pool.query(
        'SELECT id, created_by, assigned_to FROM tickets WHERE id = ?',
        [ticketId]
    );
    if (rows.length === 0) return { canAccess: false, ticket: null };

    const ticket = rows[0];
    const role = user.role.name;

    if (role === 'MANAGER') return { canAccess: true, ticket };
    if (role === 'SUPPORT' && ticket.assigned_to === user.id) return { canAccess: true, ticket };
    if (role === 'USER' && ticket.created_by === user.id) return { canAccess: true, ticket };

    return { canAccess: false, ticket };
};

const addComment = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);
        const { comment } = req.body;

        const { canAccess, ticket } = await canAccessTicket(ticketId, req.user);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        if (!canAccess) return res.status(403).json({ message: 'Access denied to this ticket' });

        const [result] = await pool.query(
            'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
            [ticketId, req.user.id, comment]
        );

        const [rows] = await pool.query(COMMENT_SELECT + ' WHERE tc.id = ?', [result.insertId]);
        return res.status(201).json(formatComment(rows[0]));
    } catch (err) {
        console.log('addComment error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const listComments = async (req, res) => {
    try {
        const ticketId = parseInt(req.params.id);

        const { canAccess, ticket } = await canAccessTicket(ticketId, req.user);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        if (!canAccess) return res.status(403).json({ message: 'Access denied to this ticket' });

        const [rows] = await pool.query(
            COMMENT_SELECT + ' WHERE tc.ticket_id = ? ORDER BY tc.created_at ASC',
            [ticketId]
        );
        return res.json(rows.map(formatComment));
    } catch (err) {
        console.log('listComments error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const editComment = async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const { comment } = req.body;

        const [rows] = await pool.query('SELECT id, user_id FROM ticket_comments WHERE id = ?', [commentId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (req.user.role.name !== 'MANAGER' && rows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'You can only edit your own comments' });
        }

        await pool.query('UPDATE ticket_comments SET comment = ? WHERE id = ?', [comment, commentId]);

        const [updated] = await pool.query(COMMENT_SELECT + ' WHERE tc.id = ?', [commentId]);
        return res.json(formatComment(updated[0]));
    } catch (err) {
        console.log('editComment error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteComment = async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);

        const [rows] = await pool.query('SELECT id, user_id FROM ticket_comments WHERE id = ?', [commentId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (req.user.role.name !== 'MANAGER' && rows[0].user_id !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        await pool.query('DELETE FROM ticket_comments WHERE id = ?', [commentId]);
        return res.status(204).send();
    } catch (err) {
        console.log('deleteComment error: ' + err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { addComment, listComments, editComment, deleteComment };
