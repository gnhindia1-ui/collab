
import mysql from 'mysql2/promise';

// Check if all required environment variables are present
const requiredEnvVars = [
    'DB_HOST_PRODUCTS',
    'DB_USER_PRODUCTS',
    'DB_PASS_PRODUCTS',
    'DB_NAME_PRODUCTS',
];

const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables for products database: ${missingEnvVars.join(', ')}`
    );
}

const productPool = mysql.createPool({
    host: process.env.DB_HOST_PRODUCTS,
    // Port handling: try to parse DB_PORT_PRODUCTS, fallback to defaults or 3306
    port: parseInt(process.env.DB_PORT_PRODUCTS || '3306'),
    user: process.env.DB_USER_PRODUCTS,
    password: process.env.DB_PASS_PRODUCTS,
    database: process.env.DB_NAME_PRODUCTS,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: process.env.DB_CHARSET_PRODUCTS || 'utf8mb4',
});

// Test the connection
productPool.getConnection()
    .then(connection => {
        console.log('Successfully connected to Products database');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to Products database:', err);
    });

export default productPool;
