import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Note {
  note_id?: number;
  noter_id: number;
  title?: string;
  content?: string;
  created_at?: Date;
  updated_at?: Date;
  termination_marked?: boolean;
}

export interface NoteRow extends RowDataPacket {
  note_id: number;
  noter_id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  termination_marked: boolean;
  // Joined user data
  first_name?: string;
  last_name?: string;
  email?: string;
}

export class NoteModel {
  static async create(noteData: Omit<Note, 'note_id' | 'created_at' | 'updated_at'>): Promise<number | null> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO Notes (noter_id, title, content, termination_marked) 
         VALUES (?, ?, ?, ?)`,
        [
          noteData.noter_id,
          noteData.title || 'Untitled',
          noteData.content || '',
          noteData.termination_marked || false
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  static async findById(noteId: number): Promise<NoteRow | null> {
    try {
      const [rows] = await pool.execute<NoteRow[]>(
        `SELECT n.*, u.first_name, u.last_name, u.email 
         FROM Notes n 
         JOIN Users u ON n.noter_id = u.user_id 
         WHERE n.note_id = ?`,
        [noteId]
      );

      return rows[0] || null;
    } catch (error) {
      console.error('Error finding note by ID:', error);
      throw error;
    }
  }

  static async findByUserId(userId: number, limit: number = 50, offset: number = 0): Promise<NoteRow[]> {
    try {
      const [rows] = await pool.execute<NoteRow[]>(
        `SELECT n.*, u.first_name, u.last_name 
         FROM Notes n 
         JOIN Users u ON n.noter_id = u.user_id 
         WHERE n.noter_id = ? AND n.termination_marked = 0
         ORDER BY n.created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      return rows;
    } catch (error) {
      console.error('Error finding notes by user ID:', error);
      throw error;
    }
  }

  static async update(noteId: number, userId: number, updates: Partial<Pick<Note, 'title' | 'content'>>): Promise<boolean> {
    try {
      const fields = [];
      const values = [];

      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.content !== undefined) {
        fields.push('content = ?');
        values.push(updates.content);
      }

      if (fields.length === 0) return false;

      values.push(noteId, userId);

      const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE Notes SET ${fields.join(', ')} WHERE note_id = ? AND noter_id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  static async markForTermination(noteId: number, userId: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE Notes SET termination_marked = 1 WHERE note_id = ? AND noter_id = ?',
        [noteId, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking note for termination:', error);
      throw error;
    }
  }

  static async delete(noteId: number, userId: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'DELETE FROM Notes WHERE note_id = ? AND noter_id = ?',
        [noteId, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  static async search(query: string, userId?: number, limit: number = 50): Promise<NoteRow[]> {
    try {
      let sql = `
        SELECT n.*, u.first_name, u.last_name 
        FROM Notes n 
        JOIN Users u ON n.noter_id = u.user_id 
        WHERE n.termination_marked = 0 
        AND (n.title LIKE ? OR n.content LIKE ?)
      `;
      const params = [`%${query}%`, `%${query}%`];

      if (userId) {
        sql += ' AND n.noter_id = ?';
        params.push(userId.toString());
      }

      sql += ' ORDER BY n.created_at DESC LIMIT ?';
      params.push(limit.toString());

      const [rows] = await pool.execute<NoteRow[]>(sql, params);

      return rows;
    } catch (error) {
      console.error('Error searching notes:', error);
      throw error;
    }
  }
}