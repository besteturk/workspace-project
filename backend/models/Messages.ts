import { ObjectId, WithId } from 'mongodb';
import { getDb } from '../config/mongo';

export interface Message {
  _id?: ObjectId;
  sender_id: number;      // int
  receiver_id: ObjectId;  // Chat _id
  contents: string;
  sent_at: Date;
}

export class MessagesModel {
  static async create(msg: Omit<Message, '_id'>) {
    const db = await getDb();
    const res = await db.collection<Message>('messages').insertOne(msg);
    return res.insertedId;
  }

  static async listByChat(chatId: string | ObjectId, limit = 50, before?: Date) {
    const db = await getDb();
    const receiver_id = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;

    const query: any = { receiver_id };
    if (before) query.sent_at = { $lt: before };

    return db.collection<Message>('messages')
      .find(query)
      .sort({ sent_at: -1, _id: -1 })    // keyset-friendly
      .limit(Math.min(limit, 200))
      .toArray();
  }

  static async listBySender(senderId: number, limit = 50, before?: Date) {
    const db = await getDb();
    const query: any = { sender_id: senderId };
    if (before) query.sent_at = { $lt: before };

    return db.collection<Message>('messages')
      .find(query)
      .sort({ sent_at: -1, _id: -1 })
      .limit(Math.min(limit, 200))
      .toArray();
  }

  static async deleteForSender(messageId: string | ObjectId, senderId: number) {
    const db = await getDb();
    const _id = typeof messageId === 'string' ? new ObjectId(messageId) : messageId;
    const res = await db.collection<Message>('messages').deleteOne({ _id, sender_id: senderId });
    return res.deletedCount > 0;
  }
}
