const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require("mysql2/promise");
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Enhanced Middleware Configuration
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hoteldb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Enhanced Login Endpoint
app.post('/api/auth/login', async (req, res) => {
    console.log('Login request received:', req.body);

    try {
        // Validate request
        if (!req.body || !req.body.ssn) {
            console.error('SSN missing in request');
            return res.status(400).json({
                success: false,
                error: 'SSN is required'
            });
        }

        const cleanSSN = req.body.ssn.toString().replace(/-/g, '');
        console.log('Processing SSN:', cleanSSN);

        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query(
                `SELECT SSN, FirstName, LastName, Role 
                 FROM employee 
                 WHERE SSN = ?`,
                [cleanSSN]
            );

            if (rows.length === 0) {
                console.log('No employee found with SSN:', cleanSSN);
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            const employee = rows[0];
            const token = `emp-${employee.SSN}-${Date.now()}`;

            console.log('Successful login for:', employee.FirstName, employee.LastName);

            res.json({
                success: true,
                token,
                employee: {
                    SSN: employee.SSN,
                    Name: `${employee.FirstName} ${employee.LastName}`,
                    Role: employee.Role
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Login error:', {
            message: error.message,
            stack: error.stack,
            sql: error.sql,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({
            success: false,
            error: 'Authentication service unavailable',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
});

// API Routes
const bookingRoutes = require('./routes/booking');
const roomRoutes = require('./routes/rooms');
app.use('/api/bookings', bookingRoutes);
app.use('/api/rooms', roomRoutes);

// Static Files Middleware
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// SPA Fallback Route (Must be last)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Database Verification
async function verifyDatabase() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [employees] = await connection.query('SELECT COUNT(*) AS count FROM employee');
        console.log(`✅ Database connection successful (${employees[0].count} employees)`);

        // Verify table structure
        const [columns] = await connection.query('DESCRIBE employee');
        const requiredColumns = ['SSN', 'FirstName', 'LastName', 'Role'];
        const missingColumns = requiredColumns.filter(col =>
            !columns.some(c => c.Field === col));

        if (missingColumns.length > 0) {
            throw new Error(`Missing columns in employee table: ${missingColumns.join(', ')}`);
        }

        // Log sample employee data for debugging
        const [sample] = await connection.query('SELECT SSN, FirstName, LastName FROM employee LIMIT 1');
        console.log('Sample employee data:', sample[0]);
    } catch (err) {
        console.error('❌ Database verification failed:', err);
        process.exit(1);
    } finally {
        if (connection) connection.release();
    }
}

// Server Startup
async function startServer() {
    await verifyDatabase();

    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log('\nAvailable routes:');
        console.log('- POST /api/auth/login');
        console.log('- GET /api/bookings/*');
        console.log('- GET /api/rooms/*');
        console.log('\nMake sure your frontend is running on http://localhost:3000');
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use`);
        } else {
            console.error('Server error:', error);
        }
        process.exit(1);
    });
}

// Error Handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

startServer().catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
});

module.exports = { app, pool };