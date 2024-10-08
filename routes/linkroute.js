const express = require('express');
const {createShortLink, authenticateJWT ,redirectLink} = require('../controllers/linkcontroller');
const router = express.Router();

router.post('/shorten', authenticateJWT, createShortLink);
router.get('/:shortcode', redirectLink);

module.exports = router;


