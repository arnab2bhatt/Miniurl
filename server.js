const express = require('express');
const authRoutes = require('./routes/authroute');
const linkRoutes = require('./routes/linkroute');
const cookieParser = require('cookie-parser');
const anaRoutes = require('./routes/anaroutes');
const { verifyToken } = require('./routes/authroute'); // Import the JWT middleware for protected routes
const { authenticateJWT } = require('./controllers/linkcontroller');

const app = express();
const port = 3000;

// Middleware to parse JSON and handle cookies
app.use(express.json());
app.use(cookieParser('secretKey'));

// Public Routes (e.g., signup and login)
app.use('/authroute', authRoutes);

// Protected Routes (Apply JWT middleware to routes that require authentication)
app.use('/linkroute', authenticateJWT, linkRoutes);
app.use('links/:shortcode',anaRoutes);
app.use('/links/analytics',authenticateJWT, anaRoutes); // Assuming the analytics routes are protected as well

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
