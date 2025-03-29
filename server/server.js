const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mysql = require("mysql2");
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

// API Routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const roomRoutes = require('./routes/rooms');

console.log('Route types:', {
    auth: typeof authRoutes,
    booking: typeof bookingRoutes,
    rooms: typeof roomRoutes
});

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rooms', roomRoutes);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// SPA catch-all
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Improved MySQL connection with error handling
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_db',
    insecureAuth: true // Add this if using older MySQL auth
});

// Connect with retry logic
function handleDisconnect() {
    db.connect(err => {
        if (err) {
            console.error('Database connection failed:', err.message);
            console.log('Retrying connection in 5 seconds...');
            setTimeout(handleDisconnect, 5000);
            return;
        }
        console.log('Successfully connected to MySQL database');
    });

    db.on('error', err => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});