const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});