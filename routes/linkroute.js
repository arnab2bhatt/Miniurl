const express = require('express');
const {createShortLink, authenticateJWT , getShortLink} = require('../controllers/linkcontroller');
const router = express.Router();

router.post('/shorten', authenticateJWT, createShortLink);
router.get('/:shortcode', getShortLink);

module.exports = router;


