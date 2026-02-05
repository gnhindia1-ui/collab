-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role TINYINT NOT NULL DEFAULT 1 COMMENT '1=admin, 2=superadmin',
    passwordResetToken VARCHAR(255) NULL,
    passwordResetExpires DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_passwordResetToken (passwordResetToken)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 3. Role Column Permissions table
CREATE TABLE IF NOT EXISTS role_column_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    is_editable BOOLEAN DEFAULT TRUE,
    UNIQUE KEY idx_role_column (role_id, column_name),
    INDEX idx_role_id (role_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Create registration_tokens table
CREATE TABLE IF NOT EXISTS registration_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(10) NOT NULL UNIQUE,
    created_by INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by INT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_used (is_used),
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Insert a default superadmin user (password: 'admin123')
-- This is a bcrypt hash of 'admin123' - CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN
INSERT INTO
    users (email, password, name, role)
VALUES (
        'admin@pharmacatalog.com',
        '$2a$10$rQ3gZxvxWJYf5F5F5F5F5uKj7J8KqZ9Zq9Zq9Zq9Zq9Zq9Zq9Zq',
        'Super Admin',
        2
    )
ON DUPLICATE KEY UPDATE
    email = email;

-- Blogs table
CREATE TABLE IF NOT EXISTS blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content LONGTEXT NOT NULL,
    summary TEXT,
    author_id INT NOT NULL,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_slug (slug),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Note: The above password hash is a placeholder.
-- After running this script, use the following to generate a proper hash:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('your_password', 10);