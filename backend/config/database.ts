import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'notes_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  reconnect: true,
  charset: 'utf8mb4'
};

export const pool = mysql.createPool(dbConfig);

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

export const initializeDatabase = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Users(
        user_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        pfp_url VARCHAR(255),
        role ENUM('user','admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) AUTO_INCREMENT = 100000;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Notes(
        note_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
        noter_id INT NOT NULL,
        title VARCHAR(255) DEFAULT 'Untitled',
        content TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        termination_marked BOOLEAN DEFAULT 0,
        FOREIGN KEY(noter_id) REFERENCES Users(user_id) ON DELETE CASCADE
      );
    `);

    console.log('Database tables initialized successfully');
    return true;
  } catch (error: any) {
    console.error('Database initialization failed:', error.message);
    return false;
  }
};