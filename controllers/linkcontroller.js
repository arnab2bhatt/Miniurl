const pool = require('../database');
const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
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
    const { long_url, mobile_url, name, expires_at, custom_shortcode } = req.body;

    // Ensure long_url is provided
    if (!long_url) {
        return res.status(400).json({ message: 'Long URL is required' });
    }

    // Check if the user is logged in
    if (!req.user || !req.user.id) {
        return res.status(403).json({ message: 'URL shortening is not allowed after logout.' });
    }

    try {
        let shortcode = custom_shortcode;
        let shortcodeExists = true;

        // Check if the custom shortcode is provided and valid, or generate a new one
        if (custom_shortcode) {
            const codeCheckQuery = 'SELECT * FROM links WHERE shortcode = $1';
            const existingLink = await pool.query(codeCheckQuery, [custom_shortcode]);
            if (existingLink.rows.length > 0) {
                return res.status(400).json({ message: 'Custom shortcode already exists' });
            } else {
                shortcodeExists = false; // Custom shortcode is unique
            }
        } else {
            // Generate a unique shortcode if custom one isn't provided
            while (shortcodeExists) {
                shortcode = generateShortCode();
                const codeCheckQuery = 'SELECT * FROM links WHERE shortcode = $1';
                const existingLink = await pool.query(codeCheckQuery, [shortcode]);
                if (existingLink.rows.length === 0) {
                    shortcodeExists = false; // Generated shortcode is unique
                }
            }
        }

        // Insert the new link into the database with mobile_url and long_url
        const insertLinkQuery = `
            INSERT INTO links(long_url, mobile_url, shortcode, name, created_at, expires_at, creator_id)
            VALUES ($1, $2, $3, $4, DEFAULT, $5, $6)
            RETURNING *`;
        const newLink = await pool.query(insertLinkQuery, [long_url, mobile_url || null, shortcode, name || null, expires_at || null, req.user.id]);

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



// Function to fetch all shortcodes for the logged-in user
const getAllShortcodes = async (req, res) => {
    const userId = req.user.id; // Assuming `req.user` contains authenticated user data

    try {
        // SQL query to retrieve all shortcodes for the current user
        const query = `SELECT shortcode FROM links WHERE creator_id = $1 ORDER BY created_at DESC`;
        const result = await pool.query(query, [userId]);

        // Format the shortcodes as URLs
        const formattedLinks = result.rows.map(row => ({
            shortUrl: `https://arnab.site/links/${row.shortcode}`
        }));

        // Send the formatted short URLs as the response
        res.status(200).json(formattedLinks);
    } catch (error) {
        console.error('Error fetching links:', error);
        res.status(500).json({ message: 'Error fetching links' });
    }
};


module.exports = { createShortLink, authenticateJWT, getAllShortcodes };

