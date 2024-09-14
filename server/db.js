const { Pool } = require('pg');

const pool = new Pool({
    user: "postgres",
    password: "Ramadan1??",
    host: "localhost",
    port: 5432,
    database: "mrmotivate3"
});

module.exports = pool;