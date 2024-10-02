const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();
// Get the credentials and connection info from Aiven
const pool = new Pool({
    user: process.env.DB_USER,         // Aiven DB username
    host: process.env.DB_HOST,         // Aiven DB hostname
    database: process.env.DB_NAME,     // Aiven DB name
    password: String(process.env.DB_PASSWORD), // Aiven DB password
    port: process.env.DB_PORT,         // Port number, usually 5432 for PostgreSQL
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync('./ca.pem').toString(), // Path to SSL CA cert, provided by Aiven
    },
});
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to Aiven database:', err);
    } else {
        console.log('Connected to Aiven database!');
    }
});
module.exports = pool;