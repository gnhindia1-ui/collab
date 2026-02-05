const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

async function listUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        const [rows] = await connection.query('SELECT id, email, name, role FROM users');
        console.log('--- Current Users in Database ---');
        console.table(rows);
        console.log('-------------------------------');
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await connection.end();
    }
}

listUsers();
