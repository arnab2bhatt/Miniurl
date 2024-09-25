const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { addUser, validateUser } = require('./users');

// Secret key for JWT
const SECRET_KEY = 'your-secret-key';

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// In-memory store for logged-in tokens
let loggedInTokens = new Set();

// Signup route
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    const success = addUser(username, password);
    if (success) {
        return res.status(201).json({ message: 'User signed up successfully' });
    } else {
        return res.status(409).json({ message: 'Username already exists' });
    }
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    const isValid = validateUser(username, password);
    if (isValid) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        loggedInTokens.add(token);
        return res.status(200).json({ message: 'Login successful', token });
    } else {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Middleware to verify JWT and check if user is logged in
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token || !loggedInTokens.has(token)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
}

// Logout route
app.post('/logout', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    loggedInTokens.delete(token);
    return res.status(200).json({ message: 'Logout successful' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
