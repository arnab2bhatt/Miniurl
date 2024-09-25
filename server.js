const express = require('express');
const authRoutes = require('./routes/authroute');

const app = express();
const port = 3000;

app.use(express.json());

// Auth routes
app.use('/authroute', authRoutes);

// Start the server
app.listen(port, () => {
    console.log('Server running at http://localhost:${port}');
});