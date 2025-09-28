import { pool } from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { UserModel } from "./User";

type TeamMemberRole = "member" | "admin";

export interface TeamRow extends RowDataPacket {
  team_id: number;
  name: string;
  description: string | null;
  created_by: number;
  created_at: Date;
}

export interface TeamMemberRow extends RowDataPacket {
  team_member_id: number;
  team_id: number;
  user_id: number;
  role: TeamMemberRole;
  joined_at: Date;
  first_name?: string;
  last_name?: string;
  email?: string;
  pfp_url?: string | null;
  job_title?: string | null;
}

export class TeamModel {
  static async findById(teamId: number): Promise<TeamRow | null> {
    const [rows] = await pool.execute<TeamRow[]>(
      `SELECT * FROM Teams WHERE team_id = ? LIMIT 1`,
      [teamId]
    );

    return rows[0] ?? null;
  }

  static async findByUserId(userId: number): Promise<TeamRow | null> {
    const [rows] = await pool.execute<TeamRow[]>(
      `SELECT t.*
       FROM Teams t
       INNER JOIN TeamMembers tm ON t.team_id = tm.team_id
       WHERE tm.user_id = ?
       ORDER BY t.created_at ASC
       LIMIT 1`,
      [userId]
    );

    return rows[0] ?? null;
  }

  static async create(teamData: { name: string; description?: string; created_by: number }): Promise<number | null> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Teams (name, description, created_by)
       VALUES (?, ?, ?)`,
      [teamData.name, teamData.description ?? null, teamData.created_by]
    );

    return result.insertId || null;
  }

  static async addMember(teamId: number, userId: number, role: TeamMemberRole = "member"): Promise<void> {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO TeamMembers (team_id, user_id, role)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role)`,
      [teamId, userId, role]
    );
  }

  static async ensureDefaultTeam(userId: number): Promise<TeamRow | null> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const [userRows] = await pool.execute<RowDataPacket[]>(
      `SELECT first_name, last_name FROM Users WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    const user = userRows[0] as { first_name: string; last_name: string } | undefined;
    if (!user) {
      return null;
    }

    const teamName = `${user.first_name} ${user.last_name}`.trim() || "Personal Team";

    const teamId = await this.create({
      name: `${teamName}'s Team`,
      description: "Auto-generated team",
      created_by: userId,
    });

    if (!teamId) {
      return null;
    }

    await this.addMember(teamId, userId, "admin");

    return this.findById(teamId);
  }

  static async getMembers(teamId: number): Promise<TeamMemberRow[]> {
    const [rows] = await pool.execute<TeamMemberRow[]>(
      `SELECT tm.*, u.first_name, u.last_name, u.email, u.pfp_url, u.job_title
       FROM TeamMembers tm
       INNER JOIN Users u ON tm.user_id = u.user_id
       WHERE tm.team_id = ?
       ORDER BY tm.joined_at ASC`,
      [teamId]
    );

    return rows;
  }

  static async ensureSampleMembers(teamId: number, ownerId: number): Promise<void> {
    const [countRows] = await pool.execute<Array<RowDataPacket & { count: number }>>(
      `SELECT COUNT(*) AS count FROM TeamMembers WHERE team_id = ?`,
      [teamId]
    );

    if ((countRows[0]?.count ?? 0) > 1) {
      return;
    }

    const sampleMembers = [
      {
        first_name: "Bob",
        last_name: "Smith",
        email: "bob.sample@workspace.local",
        job_title: "Frontend Developer",
        location: "Remote",
      },
      {
        first_name: "Carol",
        last_name: "Davis",
        email: "carol.sample@workspace.local",
        job_title: "UX Researcher",
        location: "Austin, TX",
      },
      {
        first_name: "David",
        last_name: "Wilson",
        email: "david.sample@workspace.local",
        job_title: "Backend Engineer",
        location: "New York, NY",
      },
    ];

    for (const member of sampleMembers) {
      const existingUser = await UserModel.findByEmail(member.email);
      const userId = existingUser
        ? existingUser.user_id
        : await UserModel.create({
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email,
            password: "password123",
            role: "user",
            job_title: member.job_title,
            location: member.location,
          });

      if (!userId) {
        continue;
      }

      await this.addMember(teamId, userId, "member");
    }

    await this.addMember(teamId, ownerId, "admin");
  }

  static async ensureTeamWithSamples(userId: number): Promise<TeamRow | null> {
    const team = await this.ensureDefaultTeam(userId);
    if (!team) {
      return null;
    }

    await this.ensureSampleMembers(team.team_id, userId);

    return team;
  }
}
