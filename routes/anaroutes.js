const express = require('express');
const { trackAndRedirectLink, getAnalytics } = require('../controllers/analytics.js');
const router = express.Router();

// Route for tracking clicks on a shortened link
router.get('/:shortcode', trackAndRedirectLink);

// Route for fetching analytics for a shortened link
router.get('/analytics/:shortcode', getAnalytics);

module.exports = router;
