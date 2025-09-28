import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB  = process.env.MONGO_DB  || 'ChatsAndMessages';

let client: MongoClient | null = null;
let db: Db | null = null;

export const getDb = async (): Promise<Db> => {
  if (db) return db;
  client = new MongoClient(MONGO_URI, { maxPoolSize: 10 });
  await client.connect();
  db = client.db(MONGO_DB);
  return db;
};

export const testConnection = async () => {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    console.log('MongoDB connected successfully');
    return true;
  } catch (err: any) {
    console.error('MongoDB connection failed:', err.message);
    return false;
  }
};

/**
 * Initialize DB: create collections if missing, apply validators, create indexes.
 * Safe to call on every boot (idempotent).
 */
export const initializeDatabase = async () => {
  try {
    const db = await getDb();

    // Ensure collections exist
    const existing = await db.listCollections({}, { nameOnly: true }).toArray();
    const names = new Set(existing.map(c => c.name));

    if (!names.has('Chats')) await db.createCollection('Chats');
    if (!names.has('messages')) await db.createCollection('messages');

    // --- JSON Schema validators ---

    // Chats
    const chatsValidator = {
      $jsonSchema: {
        bsonType: 'object',
        required: ['title', 'members', 'chat_type'],
        properties: {
          title: { bsonType: 'string', description: 'The title must be a string' },
          members: {
            bsonType: 'array',
            minItems: 2,
            description:
              'Each members list must have at least two member credentials held as arrays, each member credential array must have the following properties in that order: User name, unique user id, role of the user on the server',
            items: {
              bsonType: 'array',
              minItems: 3,
              maxItems: 3,
              items: [
                { bsonType: 'string' },                  // user name
                { bsonType: 'string' },                  // unique user id
                { bsonType: 'string', enum: ['user','admin'] } // role
              ]
            }
          },
          chat_type: {
            bsonType: 'string',
            enum: ['dm', 'group chat'],
            description: 'Must be either personal chat(dm) or a group chat'
          }
        }
      }
    };

    // messages (receiver_id -> ObjectId)
    const messagesValidator = {
      $jsonSchema: {
        bsonType: 'object',
        required: ['sender_id', 'receiver_id', 'contents', 'sent_at'],
        properties: {
          sender_id: {
            bsonType: 'int',
            description: 'sender_id must be the id of the sender in integer format'
          },
          receiver_id: {
            bsonType: 'objectId',
            description: 'receiver_id must be the ObjectId of the chat that is receiving this message'
          },
          contents: {
            bsonType: 'string',
            description: 'contents must be a string'
          },
          sent_at: {
            bsonType: 'date',
            description: 'sent_at must be a date'
          }
        }
      }
    };

    // Apply validators (collMod is idempotent)
    await db.command({
      collMod: 'Chats',
      validator: chatsValidator,
      validationLevel: 'strict',
      validationAction: 'error'
    });
    await db.command({
      collMod: 'messages',
      validator: messagesValidator,
      validationLevel: 'strict',
      validationAction: 'error'
    });

    // --- Indexes ---
    await db.collection('Chats').createIndexes([
      { key: { title: 1 }, name: 'title_asc' },
      // 2nd element in each member tuple is user id → dot-path index for lookups
      { key: { 'members.1': 1 }, name: 'memberUserId' }
    ]);

    await db.collection('messages').createIndexes([
      { key: { receiver_id: 1, sent_at: -1 }, name: 'by_chat_time' },
      { key: { sender_id: 1,  sent_at: -1 }, name: 'by_sender_time' }
    ]);

    console.log('MongoDB initialized successfully');
    return true;
  } catch (err: any) {
    console.error('MongoDB initialization failed:', err.message);
    return false;
  }
};
