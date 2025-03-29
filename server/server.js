const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require("mysql2")
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

// API Routes - MUST come before static files
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const roomRoutes = require('./routes/rooms'); // Add this line

// Verify routers
console.log('Route types:', {
    auth: typeof authRoutes,
    booking: typeof bookingRoutes,
    rooms: typeof roomRoutes
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rooms', roomRoutes); // Add this line

// Static files (AFTER API routes)
app.use(express.static(path.join(__dirname, '../public')));

// SPA catch-all (MUST be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Connect to MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed: " + err.stack);
        return ;
    }
    console.log("Connected to MySQL");
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});