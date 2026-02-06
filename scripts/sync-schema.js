const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function syncSchema() {
    console.log('Starting Schema Sync...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        console.log('Connected to database.');

        // 1. BLOGS: Drop and Recreate because schema is totally different
        console.log('Upgrading BLOGS table...');
        await connection.query('DROP TABLE IF EXISTS blogs');

        const createBlogs = `
            CREATE TABLE blogs (
                blog_id int(11) NOT NULL AUTO_INCREMENT,
                blog_title varchar(255) NOT NULL,
                blog_slug varchar(255) NOT NULL,
                blog_heroimg varchar(255) DEFAULT NULL,
                blog_content text NOT NULL,
                blog_author varchar(100) DEFAULT NULL,
                blog_tag longtext DEFAULT NULL,
                blog_keywords varchar(255) DEFAULT NULL,
                blog_description varchar(255) DEFAULT NULL,
                blog_view int(11) DEFAULT 0,
                blog_like int(11) DEFAULT 0,
                blog_created datetime DEFAULT current_timestamp(),
                blog_updated datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                blog_ispub tinyint(1) DEFAULT 0,
                PRIMARY KEY (blog_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await connection.query(createBlogs);
        console.log('BLOGS table created.');

        // 2. WEB_EVENTS
        console.log('Creating WEB_EVENTS table...');
        await connection.query('DROP TABLE IF EXISTS web_events');

        const createEvents = `
            CREATE TABLE web_events (
                events_id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
                events_title varchar(255) NOT NULL,
                events_slug varchar(255) NOT NULL,
                events_heroimg varchar(50) DEFAULT NULL,
                events_imgset longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(events_imgset)),
                events_content text NOT NULL,
                events_start date DEFAULT NULL,
                events_end date DEFAULT NULL,
                events_ispub tinyint(1) NOT NULL DEFAULT 1,
                PRIMARY KEY (events_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await connection.query(createEvents);
        console.log('WEB_EVENTS table created.');

        // 3. WEB_NEWS
        console.log('Creating WEB_NEWS table...');
        await connection.query('DROP TABLE IF EXISTS web_news');

        const createNews = `
            CREATE TABLE web_news (
                news_id int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
                news_title varchar(255) NOT NULL,
                news_slug varchar(255) NOT NULL,
                news_img varchar(255) DEFAULT NULL,
                news_content text DEFAULT NULL,
                news_view int(10) UNSIGNED NOT NULL DEFAULT 0,
                news_created datetime NOT NULL DEFAULT current_timestamp(),
                news_ispub tinyint(1) NOT NULL DEFAULT 1,
                PRIMARY KEY (news_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await connection.query(createNews);
        console.log('WEB_NEWS table created.');

        console.log('SUCCESS: All tables synced!');

    } catch (error) {
        console.error('Schema Sync Error:', error);
    } finally {
        await connection.end();
    }
}

syncSchema();
