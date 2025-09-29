import express from 'express';
import { NoteModel } from '../models/Note';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { isDatabaseDisabled } from '../config/database';
import {
  createDummyNote,
  deleteDummyNote,
  getDummyNoteById,
  getDummyNotes,
  updateDummyNote,
} from '../dummy-data/notes';

const router = express.Router();

// Create new note
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    if (isDatabaseDisabled) {
      const newNote = createDummyNote(req.user!.user_id, title || 'Untitled', content);
      return res.status(201).json({
        message: 'Note created successfully (mock)',
        note: newNote,
      });
    }

    const noteId = await NoteModel.create({
      noter_id: req.user!.user_id,
      title: title || 'Untitled',
      content
    });

    if (!noteId) {
      return res.status(500).json({ error: 'Failed to create note' });
    }

    const newNote = await NoteModel.findById(noteId);

    res.status(201).json({
      message: 'Note created successfully',
      note: newNote
    });

  } catch (error) {
    console.error('Note creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's notes
router.get('/my-notes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    if (isDatabaseDisabled) {
      const notes = getDummyNotes(req.user!.user_id, limit, offset);
      return res.json({
        notes,
        pagination: {
          page,
          limit,
          hasMore: false,
        },
      });
    }

    const notes = await NoteModel.findByUserId(req.user!.user_id, limit, offset);

    res.json({
      notes,
      pagination: {
        page,
        limit,
        hasMore: notes.length === limit
      }
    });

  } catch (error) {
    console.error('Notes fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single note by ID
router.get('/:noteId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const noteId = parseInt(req.params.noteId);

    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    if (isDatabaseDisabled) {
      const note = getDummyNoteById(req.user!.user_id, noteId);

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      return res.json({ note });
    }

    const note = await NoteModel.findById(noteId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Check if user owns this note or is admin
    if (note.noter_id !== req.user!.user_id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ note });

  } catch (error) {
    console.error('Note fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update note
router.put('/:noteId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const noteId = parseInt(req.params.noteId);
    const { title, content } = req.body;

    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    if (!title && !content) {
      return res.status(400).json({ error: 'Title or content is required for update' });
    }

    // Check if note exists and user owns it
    if (isDatabaseDisabled) {
      const existingNote = getDummyNoteById(req.user!.user_id, noteId);
      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const updatedNote = updateDummyNote(existingNote, { title, content });

      return res.json({
        message: 'Note updated successfully (mock)',
        note: updatedNote,
      });
    }

    const existingNote = await NoteModel.findById(noteId);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (existingNote.noter_id !== req.user!.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const success = await NoteModel.update(noteId, req.user!.user_id, { title, content });

    if (!success) {
      return res.status(500).json({ error: 'Failed to update note' });
    }

    const updatedNote = await NoteModel.findById(noteId);

    res.json({
      message: 'Note updated successfully',
      note: updatedNote
    });

  } catch (error) {
    console.error('Note update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete note
router.delete('/:noteId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const noteId = parseInt(req.params.noteId);

    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }

    if (isDatabaseDisabled) {
      const existingNote = getDummyNoteById(req.user!.user_id, noteId);
      if (!existingNote || !deleteDummyNote(noteId)) {
        return res.status(404).json({ error: 'Note not found or access denied' });
      }

      return res.json({ message: 'Note deleted (mock)' });
    }

    const success = await NoteModel.delete(noteId, req.user!.user_id);

    if (!success) {
      return res.status(404).json({ error: 'Note not found or access denied' });
    }

    res.json({ message: 'Note deleted permanently' });

  } catch (error) {
    console.error('Note deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;