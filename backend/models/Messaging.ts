import { pool } from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { TeamModel } from "./Team";

export interface ConversationRow extends RowDataPacket {
  conversation_id: number;
  team_id: number | null;
  name: string | null;
  is_direct: number;
  created_at: Date;
}

export interface ConversationMemberRow extends RowDataPacket {
  conversation_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  pfp_url: string | null;
  job_title: string | null;
}

export interface MessageRow extends RowDataPacket {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: Date;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface ConversationSummary {
  conversation_id: number;
  title: string;
  is_direct: boolean;
  created_at: Date;
  unread_count: number;
  last_message: {
    message_id: number;
    content: string;
    created_at: Date;
    sender: {
      user_id: number;
      first_name: string;
      last_name: string;
      email: string;
      pfp_url?: string | null;
    };
  } | null;
  participants: Array<{
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    pfp_url?: string | null;
    job_title?: string | null;
  }>;
}

export class ConversationModel {
  static async ensureDefaultConversation(teamId: number, userId: number): Promise<number | null> {
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT c.conversation_id
       FROM Conversations c
       INNER JOIN ConversationMembers cm ON cm.conversation_id = c.conversation_id
       WHERE cm.user_id = ?
       ORDER BY c.created_at ASC
       LIMIT 1`,
      [userId]
    );

    if (existing.length > 0) {
      return (existing[0] as { conversation_id: number }).conversation_id;
    }

    const [conversationResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Conversations (team_id, name, is_direct)
       VALUES (?, ?, 0)`,
      [teamId, "General"]
    );

    const conversationId = conversationResult.insertId;

    const members = await TeamModel.getMembers(teamId);
    if (members.length === 0) {
      await pool.execute(
        `INSERT INTO ConversationMembers (conversation_id, user_id)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE last_read_at = last_read_at`,
        [conversationId, userId]
      );
    } else {
      for (const member of members) {
        await pool.execute(
          `INSERT INTO ConversationMembers (conversation_id, user_id)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE last_read_at = last_read_at`,
          [conversationId, member.user_id]
        );
      }
    }

    await MessageModel.create(
      conversationId,
      userId,
      "Welcome to the team chat! Feel free to start the conversation."
    );

    if (members.length > 1) {
      const teammate = members.find((member) => member.user_id !== userId);
      if (teammate) {
        await MessageModel.create(
          conversationId,
          teammate.user_id,
          `Hi ${members
            .find((member) => member.user_id === userId)
            ?.first_name ?? "there"}! Looking forward to collaborating with you.`
        );
      }
    }

    return conversationId;
  }

  static async addMember(conversationId: number, userId: number): Promise<void> {
    await pool.execute(
      `INSERT INTO ConversationMembers (conversation_id, user_id)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE last_read_at = last_read_at`,
      [conversationId, userId]
    );
  }

  static async isMember(conversationId: number, userId: number): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 1 FROM ConversationMembers WHERE conversation_id = ? AND user_id = ? LIMIT 1`,
      [conversationId, userId]
    );

    return rows.length > 0;
  }

  static async getSummariesForUser(userId: number): Promise<ConversationSummary[]> {
    const [conversationRows] = await pool.execute<ConversationRow[]>(
      `SELECT c.conversation_id, c.team_id, c.name, c.is_direct, c.created_at, cm.last_read_at
       FROM Conversations c
       INNER JOIN ConversationMembers cm ON cm.conversation_id = c.conversation_id
       WHERE cm.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    if (conversationRows.length === 0) {
      return [];
    }

    const conversationIds = conversationRows.map((row) => row.conversation_id);

    const [participantRows] = await pool.query<ConversationMemberRow[]>(
      `SELECT cm.conversation_id, u.user_id, u.first_name, u.last_name, u.email, u.pfp_url, u.job_title
       FROM ConversationMembers cm
       INNER JOIN Users u ON u.user_id = cm.user_id
       WHERE cm.conversation_id IN (?)`,
      [conversationIds]
    );

    const [lastMessageRows] = await pool.query<MessageRow[]>(
      `SELECT m.*, u.first_name, u.last_name, u.email, u.pfp_url
       FROM Messages m
       INNER JOIN Users u ON u.user_id = m.sender_id
       INNER JOIN (
          SELECT conversation_id, MAX(created_at) AS created_at
          FROM Messages
          WHERE conversation_id IN (?)
          GROUP BY conversation_id
       ) latest ON latest.conversation_id = m.conversation_id AND latest.created_at = m.created_at`,
      [conversationIds]
    );

    const [unreadRows] = await pool.query<Array<RowDataPacket & { conversation_id: number; unread_count: number }>>(
      `SELECT m.conversation_id, COUNT(*) AS unread_count
       FROM Messages m
       INNER JOIN ConversationMembers cm ON cm.conversation_id = m.conversation_id AND cm.user_id = ?
       WHERE m.conversation_id IN (?)
         AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
       GROUP BY m.conversation_id`,
      [userId, conversationIds]
    );

    const unreadMap = new Map<number, number>();
    unreadRows.forEach((row) => {
      unreadMap.set(row.conversation_id, row.unread_count);
    });

    const participantsMap = new Map<number, ConversationSummary["participants"]>();
    participantRows.forEach((row) => {
      const list = participantsMap.get(row.conversation_id) ?? [];
      list.push({
        user_id: row.user_id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
        pfp_url: row.pfp_url,
        job_title: row.job_title,
      });
      participantsMap.set(row.conversation_id, list);
    });

    const lastMessageMap = new Map<number, MessageRow>();
    lastMessageRows.forEach((row) => {
      lastMessageMap.set(row.conversation_id, row);
    });

    return conversationRows.map((row) => {
      const participants = participantsMap.get(row.conversation_id) ?? [];
      const lastMessage = lastMessageMap.get(row.conversation_id) ?? null;
      const unread = unreadMap.get(row.conversation_id) ?? 0;

      const title = row.name
        ? row.name
        : participants
            .filter((participant) => participant.user_id !== userId)
            .map((participant) => `${participant.first_name} ${participant.last_name}`.trim())
            .join(", ") || "Direct Message";

      return {
        conversation_id: row.conversation_id,
        title,
        is_direct: Boolean(row.is_direct),
        created_at: row.created_at,
        unread_count: unread,
        last_message: lastMessage
          ? {
              message_id: lastMessage.message_id,
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              sender: {
                user_id: lastMessage.sender_id,
                first_name: lastMessage.first_name ?? "",
                last_name: lastMessage.last_name ?? "",
                email: lastMessage.email ?? "",
                pfp_url: (lastMessage as any).pfp_url ?? null,
              },
            }
          : null,
        participants,
      } satisfies ConversationSummary;
    });
  }
}

export class MessageModel {
  static async list(conversationId: number): Promise<MessageRow[]> {
    const [rows] = await pool.execute<MessageRow[]>(
      `SELECT m.*, u.first_name, u.last_name, u.email, u.pfp_url
       FROM Messages m
       INNER JOIN Users u ON u.user_id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    return rows;
  }

  static async create(conversationId: number, senderId: number, content: string): Promise<number | null> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO Messages (conversation_id, sender_id, content)
       VALUES (?, ?, ?)`,
      [conversationId, senderId, content]
    );

    return result.insertId || null;
  }

  static async markRead(conversationId: number, userId: number): Promise<void> {
    await pool.execute(
      `UPDATE ConversationMembers
       SET last_read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
    );
  }
}
