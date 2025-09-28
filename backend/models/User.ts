import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface User {
  user_id?: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  pfp_url?: string;
  role?: 'user' | 'admin';
  job_title?: string;
  location?: string;
  bio?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserRow extends RowDataPacket {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  pfp_url?: string;
  role: 'user' | 'admin';
  job_title?: string | null;
  location?: string | null;
  bio?: string | null;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(userData: Omit<User, 'user_id' | 'created_at' | 'updated_at'>): Promise<number | null> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO Users (first_name, last_name, email, password, pfp_url, role, job_title, location, bio) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.first_name,
          userData.last_name,
          userData.email,
          hashedPassword,
          userData.pfp_url || null,
          userData.role || 'user',
          userData.job_title || null,
          userData.location || null,
          userData.bio || null
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  static async findByEmail(email: string): Promise<UserRow | null> {
    try {
      const [rows] = await pool.execute<UserRow[]>(
        'SELECT * FROM Users WHERE email = ?',
        [email]
      );
      
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static async findById(userId: number): Promise<UserRow | null> {
    try {
      const [rows] = await pool.execute<UserRow[]>(
        'SELECT user_id, first_name, last_name, email, pfp_url, role, job_title, location, bio, created_at, updated_at FROM Users WHERE user_id = ?',
        [userId]
      );
      
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  static async updateProfile(
    userId: number,
    updates: Partial<Omit<User, 'user_id' | 'email' | 'password'>>
  ): Promise<boolean> {
    try {
      const fields = [];
      const values = [];
      
      if (updates.first_name) {
        fields.push('first_name = ?');
        values.push(updates.first_name);
      }
      if (updates.last_name) {
        fields.push('last_name = ?');
        values.push(updates.last_name);
      }
      if (updates.pfp_url !== undefined) {
        fields.push('pfp_url = ?');
        values.push(updates.pfp_url);
      }
      if (updates.job_title !== undefined) {
        fields.push('job_title = ?');
        values.push(updates.job_title);
      }
      if (updates.location !== undefined) {
        fields.push('location = ?');
        values.push(updates.location);
      }
      if (updates.bio !== undefined) {
        fields.push('bio = ?');
        values.push(updates.bio);
      }
      
      if (fields.length === 0) return false;
      
      values.push(userId);
      
      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE Users SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  static async changePassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE Users SET password = ? WHERE user_id = ?',
        [hashedPassword, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  static async delete(userId: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM Users WHERE user_id = ?',
        [userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}