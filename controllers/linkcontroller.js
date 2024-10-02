const pool = require('../database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized, token missing' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach the decoded user data to the request object
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Forbidden, invalid token' });
    }
};

const generateShortCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const createShortLink = async (req, res) => {
    const { long_url, name, expires_at } = req.body;

    // Check if the user is logged in (user ID should be present in the request object)
    if (!req.user || !req.user.id) {
        return res.status(403).json({ message: 'URL shortening is not allowed after logout.' });
    }

    // Ensure the long_url is provided
    if (!long_url) {
        return res.status(400).json({ message: 'Long URL is required' });
    }

    try {
        let shortcode;
        let shortcodeExists = true;

        // Generate a unique shortcode
        while (shortcodeExists) {
            shortcode = generateShortCode();
            const codeCheckQuery = 'SELECT * FROM links WHERE shortcode = $1';
            const existingLink = await pool.query(codeCheckQuery, [shortcode]);
            if (existingLink.rows.length === 0) {
                shortcodeExists = false;
            }
        }

        // Insert the new link into the database with the creator_id (userId)
        const insertLinkQuery = `
            INSERT INTO links(long_url, shortcode, name, created_at, expires_at, creator_id)
            VALUES ($1, $2, $3, DEFAULT, $4, $5)
            RETURNING *`;
        const newLink = await pool.query(insertLinkQuery, [long_url, shortcode, name || null, expires_at || null, req.user.id]);

        res.status(201).json({
            message: 'Link shortened successfully',
            short_url: `http://localhost:3000/${shortcode}`,
            link: newLink.rows[0]
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createShortLink, authenticateJWT };
