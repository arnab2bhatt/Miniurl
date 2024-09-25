const { Pool } = require('pg');

// Create a new pool of connections
const pool = new Pool({
    user: 'postgres',       // Your PostgreSQL username
    host: 'localhost',           // Hostname (usually localhost)
    database: 'Miniurl',    // Your database name
    password: 'arnab',   // Your PostgreSQL password
    port: 5433,                  // Default PostgreSQL port
});
// Test the connection when the server starts
pool.connect()
    .then(() => console.log("Connected to the database"))
    .catch(err => console.error("Database connection error", err.stack));

module.exports = pool;
