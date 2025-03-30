// routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    
    if (!req.body || !req.body.ssn) {
      return res.status(400).json({ error: 'SSN is required' });
    }

    const cleanSSN = req.body.ssn.toString().replace(/-/g, '');
    console.log('Cleaned SSN:', cleanSSN); // Debug log

    const [rows] = await pool.execute(
      `SELECT SSN, FirstName, LastName, Role 
       FROM employee 
       WHERE SSN = ?`,
      [cleanSSN]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid SSN' });
    }

    const employee = rows[0];
    const token = jwt.sign(
      {
        ssn: employee.SSN,
        name: `${employee.FirstName} ${employee.LastName}`,
        role: employee.Role
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      employee: {
        name: `${employee.FirstName} ${employee.LastName}`,
        role: employee.Role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

module.exports = router;