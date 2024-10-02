const express = require('express');
const {createShortLink, authenticateJWT} = require('../controllers/linkcontroller');
const router = express.Router();

router.post('/shorten', authenticateJWT, createShortLink);

module.exports = router;


