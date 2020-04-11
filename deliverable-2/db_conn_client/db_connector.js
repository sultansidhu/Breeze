'use strict'
"The connection client for a SQL database connection. Connects to a MSSQL Database."

const {Pool, Client} = require('pg');

const pool = new Pool({
    user: 'breezetechs@breeze-technologies',
    host: 'breeze-technologies.postgres.database.azure.com',
    database: 'postgres',
    password: 'Breeze#1',
    port: 5432
})

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

module.exports = {
    pool: pool
}