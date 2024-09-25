const { Pool } = require('pg');


const pool = new Pool({
    user: 'postgres',       
    host: 'localhost',          
    database: 'Miniurl',    
    password: 'arnab',   
    port: 5433,                  
});

pool.connect()
    .then(() => console.log("Connected to the database"))
    .catch(err => console.error("Database connection error", err.stack));

module.exports = pool;
