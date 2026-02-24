const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/tickets', require('./routes/tickets'));
app.use('/comments', require('./routes/comments'));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
    console.log('Error: ' + err.message);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
