const express = require('express');
const {createShortLink, redirectToLongUrl} = require('../controllers/linkcontroller');
const router = express.Router();

router.post('/shorten', createShortLink);
router.get('/:shortcode', redirectToLongUrl);

module.exports = router;


