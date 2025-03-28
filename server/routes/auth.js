const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../db');
require('dotenv').config();

// Customer login endpoint
router.post('/customer/login', async (req, res) => {
    const { id } = req.body;

    try {
        const [customer] = await pool.query('SELECT * FROM customer WHERE ID = ?', [id]);

        if (!customer.length) {
            return res.status(401).json({ error: 'Invalid customer ID' });
        }

        const token = jwt.sign(
            { id: customer[0].ID, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: customer[0]
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Employee login endpoint
router.post('/employee/login', async (req, res) => {
    const { ssn } = req.body;

    try {
        const [employee] = await pool.query('SELECT * FROM employee WHERE SSN = ?', [ssn]);

        if (!employee.length) {
            return res.status(401).json({ error: 'Invalid employee SSN' });
        }

        const token = jwt.sign(
            { id: employee[0].SSN, role: employee[0].Role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: employee[0],
            role: employee[0].Role
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;