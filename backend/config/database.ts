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
        job_title VARCHAR(255),
        location VARCHAR(255),
        bio TEXT,
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

    await pool.execute(`
      ALTER TABLE Users ADD COLUMN IF NOT EXISTS job_title VARCHAR(255) NULL AFTER pfp_url;
    `);
    await pool.execute(`
      ALTER TABLE Users ADD COLUMN IF NOT EXISTS location VARCHAR(255) NULL AFTER job_title;
    `);
    await pool.execute(`
      ALTER TABLE Users ADD COLUMN IF NOT EXISTS bio TEXT NULL AFTER location;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Teams(
        team_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES Users(user_id) ON DELETE CASCADE
      );
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS TeamMembers(
        team_member_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
        team_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('member','admin') DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_team_member (team_id, user_id),
        FOREIGN KEY(team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES Users(user_id) ON DELETE CASCADE
      );
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Events(
        event_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
        team_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        assigned_to_user_id INT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
        FOREIGN KEY(assigned_to_user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
        FOREIGN KEY(created_by) REFERENCES Users(user_id) ON DELETE CASCADE
      );
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Conversations(
        conversation_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
        team_id INT,
        name VARCHAR(255),
        is_direct BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(team_id) REFERENCES Teams(team_id) ON DELETE SET NULL
      );
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ConversationMembers(
        conversation_member_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
        conversation_id INT NOT NULL,
        user_id INT NOT NULL,
        last_read_at TIMESTAMP NULL,
        UNIQUE KEY unique_conversation_member (conversation_id, user_id),
        FOREIGN KEY(conversation_id) REFERENCES Conversations(conversation_id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES Users(user_id) ON DELETE CASCADE
      );
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS Messages(
        message_id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
        conversation_id INT NOT NULL,
        sender_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(conversation_id) REFERENCES Conversations(conversation_id) ON DELETE CASCADE,
        FOREIGN KEY(sender_id) REFERENCES Users(user_id) ON DELETE CASCADE
      );
    `);

    console.log('Database tables initialized successfully');
    return true;
  } catch (error: any) {
    console.error('Database initialization failed:', error.message);
    return false;
  }
};