const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const pool = require('../database');

const trackAndRedirectLink = async (req, res) => {
    const shortcode = req.params.shortcode;
    const ipAddress = req.headers['x-forwarded-for'] || req.ip; 
    const userAgentString = req.headers['user-agent'];  

    try {
        // Get the original link from the database
        const linkQuery = 'SELECT * FROM links WHERE shortcode = $1';
        const linkResult = await pool.query(linkQuery, [shortcode]);

        if (linkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Short URL not found' });
        }

        const linkId = linkResult.rows[0].linkid;

        // Get geolocation data from the user's IP address
        const geo = geoip.lookup(ipAddress);
        const location = geo
            ? {
                  country: geo.country,
                  region: geo.region,
                  latitude: geo.ll[0],
                  longitude: geo.ll[1],
              }
            : { country: 'Unknown', region: 'Unknown' };

        // Parse the user agent string to get detailed device information
        const parser = new UAParser();
        const agent = parser.setUA(userAgentString).getResult();

        const browser = `${agent.browser.name} ${agent.browser.version || ''}`;
        const os = `${agent.os.name} ${agent.os.version || ''}`;
        const device = agent.device.type || 'Desktop'; // Detects the device type (smartphone, tablet, desktop, etc.)

        // Insert the click event into the database
        const insertClickQuery = `
            INSERT INTO clicks (link_id, timestamp, ip_address, country, region, latitude, longitude, browser, os, device)
            VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        await pool.query(insertClickQuery, [
            linkId,
            ipAddress,
            location.country,
            location.region,
            location.latitude,
            location.longitude,
            browser,
            os,
            device,
        ]);

        // Redirect the user to the long URL
        res.redirect(linkResult.rows[0].long_url);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAnalytics = async (req, res) => {
    const shortcode = req.params.shortcode;

    console.log(`Fetching analytics for short URL: ${shortcode}`);

    try {
        // Get link information from the database
        const linkQuery = 'SELECT linkid,long_url FROM links WHERE shortcode = $1';
        const linkResult = await pool.query(linkQuery, [shortcode]);

        if (linkResult.rows.length === 0) {
            console.log('Short URL not found');
            return res.status(404).json({ message: 'Short URL not found' });
        }

        const linkid = linkResult.rows[0].linkid;
        console.log(`Found link with ID: ${linkid}`);

        // Get the clicks per day for this link
        const clicksPerDayQuery = `
            SELECT COUNT(*) AS clicks, DATE(timestamp) AS day
            FROM clicks
            WHERE link_id = $1
            GROUP BY DATE(timestamp)
            ORDER BY day DESC
        `;
        const clicksPerDay = await pool.query(clicksPerDayQuery, [linkid]);

        // Get the clicks per week for this link
        const clicksPerWeekQuery = `
            SELECT COUNT(*) AS clicks, DATE_TRUNC('week', timestamp) AS week
            FROM clicks
            WHERE link_id = $1
            GROUP BY DATE_TRUNC('week', timestamp)
            ORDER BY week DESC
        `;
        const clicksPerWeek = await pool.query(clicksPerWeekQuery, [linkid]);

        console.log('Analytics data retrieved successfully');

        // Return the analytics data as JSON
        res.json({ clicksPerDay: clicksPerDay.rows, clicksPerWeek: clicksPerWeek.rows });
    } catch (error) {
        console.error('Error fetching analytics:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { trackAndRedirectLink, getAnalytics };
