const pool = require('../database');
const jwt = require('jsonwebtoken');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require('cheerio');

const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware
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

// Generate a short code for the shortened link
const generateShortCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Fetch Open Graph data from the long URL
const fetchOGData = async (url) => {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        const ogTitle = $('meta[property="og:title"]').attr('content') || '';
        const ogDescription = $('meta[property="og:description"]').attr('content') || '';
        const ogImage = $('meta[property="og:image"]').attr('content') || '';

        return { ogTitle, ogDescription, ogImage };
    } catch (error) {
        console.error('Error fetching Open Graph data:', error);
        return { ogTitle: '', ogDescription: '', ogImage: '' };
    }
};

// Create a short link with custom shortcode option
const createShortLink = async (req, res) => {
    const { long_url, name, expires_at, custom_shortcode } = req.body;

    if (!req.user || !req.user.id) {
        return res.status(403).json({ message: 'URL shortening is not allowed after logout.' });
    }

    if (!long_url) {
        return res.status(400).json({ message: 'Long URL is required' });
    }

    try {
        // Fetch Open Graph data from the long URL
        const { ogTitle, ogDescription, ogImage } = await fetchOGData(long_url);

        let shortcode = custom_shortcode; // Use custom shortcode if provided
        if (shortcode) {
            // Check if custom shortcode already exists
            const customCodeCheckQuery = 'SELECT * FROM links WHERE shortcode = $1';
            const existingCustomLink = await pool.query(customCodeCheckQuery, [shortcode]);

            if (existingCustomLink.rows.length > 0) {
                return res.status(400).json({ message: 'Custom shortcode already in use. Please choose another one.' });
            }
        } else {
            // Generate a unique shortcode if no custom one is provided
            let shortcodeExists = true;
            while (shortcodeExists) {
                shortcode = generateShortCode();
                const codeCheckQuery = 'SELECT * FROM links WHERE shortcode = $1';
                const existingLink = await pool.query(codeCheckQuery, [shortcode]);
                if (existingLink.rows.length === 0) {
                    shortcodeExists = false;
                }
            }
        }

        // Insert the new link into the database with Open Graph metadata
        const insertLinkQuery = `
            INSERT INTO links(long_url, shortcode, name, created_at, expires_at, creator_id, og_title, og_description, og_image)
            VALUES ($1, $2, $3, DEFAULT, $4, $5, $6, $7, $8)
            RETURNING *`;
        const newLink = await pool.query(insertLinkQuery, [
            long_url,
            shortcode,
            name || null,
            expires_at || null,
            req.user.id,
            ogTitle,
            ogDescription,
            ogImage,
        ]);

        res.status(201).json({
            message: 'Link shortened successfully',
            short_url: `http://localhost:3000/links/${shortcode}`,
            link: newLink.rows[0],
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Redirect link with Open Graph preview
const redirectLink = async (req, res) => {
    const shortcode = req.params.shortcode;

    try {
        const query = 'SELECT * FROM links WHERE shortcode = $1';
        const result = await pool.query(query, [shortcode]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Link not found' });
        }

        const { long_url, og_title, og_description, og_image } = result.rows[0];

        // Serve an HTML page with Open Graph tags
        res.send(`
          <html>
          <head>
            <meta property="og:title" content="${og_title}">
            <meta property="og:description" content="${og_description}">
            <meta property="og:image" content="${og_image}">
            <meta property="og:url" content="http://localhost:3000/${shortcode}">
            <meta http-equiv="refresh" content="0;url=${long_url}">
          </head>
          <body>
            <p>Redirecting to <a href="${long_url}">${long_url}</a></p>
          </body>
          </html>
        `);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createShortLink, authenticateJWT, redirectLink };
