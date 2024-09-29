const pool = require('../database');
const { link } = require('../routes/authroute');

const generateShortCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for(let i=0;i<6;i++){
        code += chars.charAt(Math.floor(Math.random()* chars.length));
    }
    return code;
};

const createShortLink = async (req, res) => {
    const {long_url, name, expires_at} = req.body;
    const userId = req.signedCookies.userId;
    if(!long_url){
        return res.status(400).json({message: 'Long URL is required'});
    }
    try{
        let shortcode;
        let shortcodeExists = true;
        while(shortcodeExists){
            shortcode = generateShortCode();
            const codeCheckQuery = 'SELECT * FROM links WHERE shortcode = $1';
            const existingLink = await pool.query(codeCheckQuery, [shortcode]);
            if(existingLink.rows.length === 0){
                shortcodeExists = false;
            }
        }
        const insertLinkQuery = `
        INSERT INTO links(long_url, shortcode, name, created_at, expires_at, creator_id)
        VALUES ($1, $2, $3, DEFAULT, $4, $5)
        RETURNING *`;
        const newLink = await pool.query(insertLinkQuery, [long_url, shortcode, name || null, expires_at || null, userId]);
        res.status(201).json({
            message: 'Link shortened successfully',
            short_url: `http://localhost:3000/${shortcode}`,
            link: newLink.rows[0]
        });
    }catch(error){
        console.error(error.message);
        res.status(500).json({message: 'server error'});
    }
};

const checkAuth = (req, res, next) => {
    const userId = req.signedCookies.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

const redirectToLongUrl = async (req, res) => {
    const { shortcode } = req.params;
    try {
        const linkQuery = 'SELECT * FROM links WHERE shortcode = $1';
        const linkResult = await pool.query(linkQuery, [shortcode]);
        if (linkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Short URL not found' });
        }
        const link = linkResult.rows[0];
        // Check for expires_at
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return res.status(410).json({ message: 'Short URL has expired' });
        }
        // Redirect to the long URL
        res.redirect(link.long_url);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};
module.exports = {createShortLink, redirectToLongUrl};