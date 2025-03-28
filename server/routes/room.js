const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper function for date overlap calculation
const buildAvailabilityQuery = (startDate, endDate) => {
    return `
    AND r.RoomID NOT IN (
      SELECT RoomID FROM booking 
      WHERE Status = 'Confirmed'
      AND (
        (CheckInDate <= ? AND CheckOutDate >= ?) OR
        (CheckInDate BETWEEN ? AND ?) OR
        (CheckOutDate BETWEEN ? AND ?)
      )
    )
    AND r.RoomID NOT IN (
      SELECT RoomID FROM renting 
      WHERE Status = 'Active'
      AND (
        (CheckInDate <= ? AND CheckOutDate >= ?) OR
        (CheckInDate BETWEEN ? AND ?) OR
        (CheckOutDate BETWEEN ? AND ?)
      )
    )
  `;
};

// Get available rooms with filters
router.get('/available', async (req, res) => {
    const {
        startDate,
        endDate,
        capacity,
        area,
        chain,
        category,
        minPrice,
        maxPrice
    } = req.query;

    try {
        // Base query with joins
        let query = `
      SELECT 
        r.*, 
        h.HotelName, 
        h.City, 
        h.State, 
        h.Rating, 
        hc.ChainName,
        GROUP_CONCAT(DISTINCT a.AmenityName) AS Amenities
      FROM room r
      JOIN hotel h ON r.HotelID = h.HotelID
      JOIN hotelchain hc ON h.ChainID = hc.ChainID
      LEFT JOIN roomamenity ra ON r.RoomID = ra.RoomID
      LEFT JOIN amenity a ON ra.AmenityID = a.AmenityID
      WHERE r.Damaged = 0
    `;

        const params = [];

        // Date availability filter
        if (startDate && endDate) {
            query += buildAvailabilityQuery(startDate, endDate);
            params.push(...Array(12).fill([startDate, endDate]).flat());
        }

        // Other filters
        const filters = [
            { condition: capacity, clause: 'AND r.Capacity = ?' },
            { condition: area, clause: 'AND (h.City = ? OR h.State = ?)' },
            { condition: chain, clause: 'AND hc.ChainName = ?' },
            { condition: category, clause: 'AND h.Rating = ?' },
            { condition: minPrice, clause: 'AND r.Price >= ?' },
            { condition: maxPrice, clause: 'AND r.Price <= ?' }
        ];

        filters.forEach(filter => {
            if (filter.condition) {
                query += filter.clause;
                if (filter.clause.includes('?')) {
                    params.push(filter.condition);
                    if (filter.clause.includes('? OR')) {
                        params.push(filter.condition); // For area which uses two params
                    }
                }
            }
        });

        // Group by room details
        query += ' GROUP BY r.RoomID';

        // Execute query
        const [rooms] = await pool.query(query, params);

        // Transform amenities string to array
        const transformedRooms = rooms.map(room => ({
            ...room,
            Amenities: room.Amenities ? room.Amenities.split(',') : []
        }));

        res.json(transformedRooms);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            message: 'Failed to fetch rooms',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Get room by ID with full details
router.get('/:id', async (req, res) => {
    try {
        const [room] = await pool.query(`
      SELECT 
        r.*, 
        h.HotelName, 
        h.City, 
        h.State, 
        h.Rating, 
        hc.ChainName,
        GROUP_CONCAT(DISTINCT a.AmenityName) AS Amenities
      FROM room r
      JOIN hotel h ON r.HotelID = h.HotelID
      JOIN hotelchain hc ON h.ChainID = hc.ChainID
      LEFT JOIN roomamenity ra ON r.RoomID = ra.RoomID
      LEFT JOIN amenity a ON ra.AmenityID = a.AmenityID
      WHERE r.RoomID = ?
      GROUP BY r.RoomID
    `, [req.params.id]);

        if (room.length === 0) {
            return res.status(404).json({ message: 'Room not found' });
        }

        // Transform amenities string to array
        const roomData = {
            ...room[0],
            Amenities: room[0].Amenities ? room[0].Amenities.split(',') : []
        };

        res.json(roomData);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            message: 'Failed to fetch room details',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router;