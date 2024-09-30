const express = require('express');
const {createShortLink, redirectToLongUrl} = require('../controllers/linkcontroller');
const router = express.Router();

router.post('/shorten', createShortLink);

module.exports = router;


