import type { NoteRow } from "../models/Note";

const BASE_NOTE_IDS = [900001, 900002, 900003];

const buildBaseNotes = (userId: number): NoteRow[] => {
    const author = {
        first_name: "Taylor",
        last_name: "Morgan",
        email: "taylor@example.com",
    };

    const now = Date.now();

    return BASE_NOTE_IDS.map((noteId, index) => ({
        note_id: noteId,
        noter_id: userId,
        title: ["Quarterly roadmap", "Launch checklist", "Retro notes"][index] ?? "Untitled",
        content:
            [
                "Draft outlining major milestones for the upcoming quarter.",
                "Checklist covering final verification steps before launch.",
                "Action items captured during last Friday's retrospective.",
            ][index] ?? "",
        created_at: new Date(now - (index + 3) * 24 * 60 * 60 * 1000),
        updated_at: new Date(now - (index + 1) * 60 * 60 * 1000),
        termination_marked: false,
        first_name: author.first_name,
        last_name: author.last_name,
        email: author.email,
    })) as NoteRow[];
};

export const getDummyNotes = (
    userId: number,
    limit: number,
    offset: number
): NoteRow[] => {
    const notes = buildBaseNotes(userId);
    return notes.slice(offset, offset + limit);
};

export const getDummyNoteById = (userId: number, noteId: number): NoteRow | null => {
    const notes = buildBaseNotes(userId);
    return notes.find((note) => note.note_id === noteId) ?? null;
};

export const createDummyNote = (
    userId: number,
    title: string,
    content: string
): NoteRow => {
    const timestamp = new Date();
    return {
        note_id: Math.floor(timestamp.getTime() / 1000),
        noter_id: userId,
        title: title || "Untitled",
        content,
        created_at: timestamp,
        updated_at: timestamp,
        termination_marked: false,
        first_name: "Taylor",
        last_name: "Morgan",
        email: "taylor@example.com",
    } as NoteRow;
};

export const updateDummyNote = (
    original: NoteRow,
    updates: { title?: string; content?: string }
): NoteRow => ({
    ...original,
    title: updates.title ?? original.title,
    content: updates.content ?? original.content,
    updated_at: new Date(),
});

export const deleteDummyNote = (noteId: number): boolean => {
    return BASE_NOTE_IDS.includes(noteId);
};
