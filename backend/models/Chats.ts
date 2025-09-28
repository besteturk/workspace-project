import { ObjectId } from 'mongodb';
import { getDb } from '../config/mongo';

export type ChatType = 'dm' | 'group chat';
export type ChatRole = 'user' | 'admin';

// [username, uniqueUserId, role]
export type MemberTuple = [string, string, ChatRole];

export interface Chat {
  _id?: ObjectId;
  title: string;
  members: MemberTuple[]; // min 2; enforced by validator
  chat_type: ChatType;
}

export class ChatsModel {
  static async create(doc: Chat) {
    const db = await getDb();
    const res = await db.collection<Chat>('Chats').insertOne(doc);
    return res.insertedId;
  }

  static async findById(chatId: string | ObjectId) {
    const db = await getDb();
    const _id = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;
    return db.collection<Chat>('Chats').findOne({ _id });
  }

  static async listByMemberUserId(userId: string, limit = 50, skip = 0) {
    const db = await getDb();
    // members.1 holds the unique user id per your schema
    return db.collection<Chat>('Chats')
      .find({ 'members.1': userId })
      .sort({ _id: -1 })
      .limit(Math.min(limit, 100))
      .skip(skip)
      .toArray();
  }

  static async rename(chatId: string | ObjectId, title: string) {
    const db = await getDb();
    const _id = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;
    const res = await db.collection<Chat>('Chats').updateOne({ _id }, { $set: { title } });
    return res.modifiedCount > 0;
  }

  static async delete(chatId: string | ObjectId) {
    const db = await getDb();
    const _id = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;
    const res = await db.collection<Chat>('Chats').deleteOne({ _id });
    return res.deletedCount > 0;
  }
}
