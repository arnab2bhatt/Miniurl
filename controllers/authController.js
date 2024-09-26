const bcrypt = require('bcryptjs');
const pool = require('../database');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken'); // If using JWT tokens

// Use cookieParser middleware
const express = require('express');
const app = express();
app.use(cookieParser('your_secret_key')); // Signed cookie

// Signup function remains the same
const signup = async (req, res) => {
    console.log("Request body:", req.body);
    const { email, password } = req.body;

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long and contain both letters and numbers.' });
    }

    try {
        const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
        const userExists = await pool.query(userCheckQuery, [email]);

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const insertUserQuery = `
            INSERT INTO users (email, password, created_at)
            VALUES ($1, $2, DEFAULT)
            RETURNING *`;
        
        const newUser = await pool.query(insertUserQuery, [email, hashedPassword]);

        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login function with cookie parser implemented
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const user = await pool.query(userQuery, [email]);

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create a token or session (JWT in this case)
        const token = jwt.sign({ userId: user.rows[0].id }, 'jwt_secret_key', { expiresIn: '1h' });

        // Cookie options
        let options = {
            maxAge: 1000 * 60 * 15,  // Expires after 15 minutes
            httpOnly: true,           // Cookie cannot be accessed via JavaScript
            signed: true              // Signed with the secret key
        };

        // Set the cookie
        res.cookie('userId', user.rows[0].id, options);
        res.cookie('authToken', token, options);

        // Set additional headers if necessary
        res.set('User-ID', user.rows[0].id);

        // Respond to the client
        res.json({ message: 'Logged in successfully', token });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout function to clear cookies
const logout = (req, res) => {
    res.clearCookie('authtoken');
    res.clearCookie('userId',{signed: true});
    res.json({ message: 'Logged out successfully' });
};

module.exports = { signup, login, logout };
