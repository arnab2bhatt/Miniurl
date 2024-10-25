const express = require('express');
const {createShortLink, authenticateJWT , getAllShortcodes} = require('../controllers/linkcontroller');
const router = express.Router();

router.post('/shorten', authenticateJWT, createShortLink);
router.get('/links', authenticateJWT, getAllShortcodes); 

module.exports = router;


