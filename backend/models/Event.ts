import { pool } from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface EventRow extends RowDataPacket {
  event_id: number;
  team_id: number;
  title: string;
  description: string | null;
  start_time: Date;
  end_time: Date;
  assigned_to_user_id: number | null;
  created_by: number;
  created_at: Date;
  assigned_first_name?: string;
  assigned_last_name?: string;
}

export interface CreateEventInput {
  team_id: number;
  title: string;
  description?: string | null;
  start_time: Date;
  end_time: Date;
  assigned_to_user_id?: number | null;
  created_by: number;
}

export class EventModel {
  static async findByTeamId(teamId: number): Promise<EventRow[]> {
    const [rows] = await pool.execute<EventRow[]>(
      `SELECT e.*, u.first_name AS assigned_first_name, u.last_name AS assigned_last_name
       FROM Events e
       LEFT JOIN Users u ON e.assigned_to_user_id = u.user_id
       WHERE e.team_id = ?
       ORDER BY e.start_time ASC`,
      [teamId]
    );

    return rows;
  }

  static async create(event: CreateEventInput): Promise<number | null> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Events (team_id, title, description, start_time, end_time, assigned_to_user_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event.team_id,
        event.title,
        event.description ?? null,
        event.start_time,
        event.end_time,
        event.assigned_to_user_id ?? null,
        event.created_by,
      ]
    );

    return result.insertId || null;
  }

  static async ensureSampleEvents(teamId: number, userId: number): Promise<void> {
    const [rows] = await pool.execute<Array<RowDataPacket & { count: number }>>(
      `SELECT COUNT(*) AS count FROM Events WHERE team_id = ?`,
      [teamId]
    );

    const count = rows[0]?.count ?? 0;
    if (count > 0) {
      return;
    }

    const now = new Date();
    const eventTemplates = [
      {
        title: "Team Standup",
        description: "Daily sync with the team",
        offsetHours: 1,
        durationMinutes: 30,
      },
      {
        title: "Design Review",
        description: "Review current design proposals",
        offsetHours: 4,
        durationMinutes: 60,
      },
      {
        title: "Project Planning",
        description: "Plan next sprint goals",
        offsetHours: 8,
        durationMinutes: 90,
      },
    ];

    for (const template of eventTemplates) {
      const start = new Date(now.getTime() + template.offsetHours * 60 * 60 * 1000);
      const end = new Date(start.getTime() + template.durationMinutes * 60 * 1000);
      await this.create({
        team_id: teamId,
        title: template.title,
        description: template.description,
        start_time: start,
        end_time: end,
        assigned_to_user_id: userId,
        created_by: userId,
      });
    }
  }
}
