import type { ConversationSummary } from "../models/Messaging";

export interface DummyMessage {
    message_id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    created_at: Date;
    first_name?: string;
    last_name?: string;
    email?: string;
    pfp_url?: string | null;
    is_read?: boolean;
}

interface DummyMessagingData {
    conversations: ConversationSummary[];
    messages: Record<number, DummyMessage[]>;
}

const toDate = (offsetMilliseconds: number = 0) =>
    new Date(Date.now() + offsetMilliseconds);

const buildBaseMessagingData = (userId: number): DummyMessagingData => {
    const youParticipant = {
        user_id: userId,
        first_name: "You",
        last_name: "",
        email: "you@example.com",
        pfp_url: null,
        job_title: "Team Member",
    };

    const taylorParticipant = {
        user_id: 200001,
        first_name: "Taylor",
        last_name: "Morgan",
        email: "taylor@example.com",
        pfp_url: null,
        job_title: "Product Manager",
    };

    const jordanParticipant = {
        user_id: 200002,
        first_name: "Jordan",
        last_name: "Lee",
        email: "jordan@example.com",
        pfp_url: null,
        job_title: "Designer",
    };

    const conversations: ConversationSummary[] = [
        {
            conversation_id: 1,
            title: "Draft review",
            is_direct: false,
            created_at: toDate(-2 * 60 * 60 * 1000),
            unread_count: 1,
            last_message: {
                message_id: 101,
                content: "Pushed the latest copy edits—take a look when you can!",
                created_at: toDate(-5 * 60 * 1000),
                sender: {
                    user_id: taylorParticipant.user_id,
                    first_name: taylorParticipant.first_name,
                    last_name: taylorParticipant.last_name,
                    email: taylorParticipant.email,
                    pfp_url: taylorParticipant.pfp_url,
                },
            },
            participants: [youParticipant, taylorParticipant, jordanParticipant],
        },
        {
            conversation_id: 2,
            title: "1:1 with Jordan",
            is_direct: true,
            created_at: toDate(-4 * 60 * 60 * 1000),
            unread_count: 0,
            last_message: {
                message_id: 102,
                content: "Sounds good—let's sync after standup tomorrow.",
                created_at: toDate(-45 * 60 * 1000),
                sender: {
                    user_id: jordanParticipant.user_id,
                    first_name: jordanParticipant.first_name,
                    last_name: jordanParticipant.last_name,
                    email: jordanParticipant.email,
                    pfp_url: jordanParticipant.pfp_url,
                },
            },
            participants: [youParticipant, jordanParticipant],
        },
    ];

    const messages: Record<number, DummyMessage[]> = {
        1: [
            {
                message_id: 90,
                conversation_id: 1,
                sender_id: taylorParticipant.user_id,
                content: "Morning! Here's the updated project outline.",
                created_at: toDate(-60 * 60 * 1000),
                first_name: taylorParticipant.first_name,
                last_name: taylorParticipant.last_name,
                email: taylorParticipant.email,
                is_read: true,
            },
            {
                message_id: 91,
                conversation_id: 1,
                sender_id: youParticipant.user_id,
                content: "Looks great—I'll add the metrics section shortly.",
                created_at: toDate(-50 * 60 * 1000),
                first_name: youParticipant.first_name,
                last_name: youParticipant.last_name,
                email: youParticipant.email,
                is_read: false,
            },
            {
                message_id: 101,
                conversation_id: 1,
                sender_id: taylorParticipant.user_id,
                content: "Pushed the latest copy edits—take a look when you can!",
                created_at: toDate(-5 * 60 * 1000),
                first_name: taylorParticipant.first_name,
                last_name: taylorParticipant.last_name,
                email: taylorParticipant.email,
                is_read: false,
            },
        ],
        2: [
            {
                message_id: 102,
                conversation_id: 2,
                sender_id: jordanParticipant.user_id,
                content: "Sounds good—let's sync after standup tomorrow.",
                created_at: toDate(-45 * 60 * 1000),
                first_name: jordanParticipant.first_name,
                last_name: jordanParticipant.last_name,
                email: jordanParticipant.email,
                is_read: true,
            },
            {
                message_id: 103,
                conversation_id: 2,
                sender_id: youParticipant.user_id,
                content: "Perfect, I'll bring the latest dashboard mockups.",
                created_at: toDate(-30 * 60 * 1000),
                first_name: youParticipant.first_name,
                last_name: youParticipant.last_name,
                email: youParticipant.email,
                is_read: false,
            },
        ],
    };

    return { conversations, messages };
};

export const getDummyConversations = (userId: number): ConversationSummary[] =>
    buildBaseMessagingData(userId).conversations;

export const getDummyMessages = (userId: number, conversationId: number): DummyMessage[] =>
    buildBaseMessagingData(userId).messages[conversationId] ?? [];

export const appendDummyMessage = (
    userId: number,
    conversationId: number,
    content: string
): DummyMessage[] => {
    const data = buildBaseMessagingData(userId);
    const list = data.messages[conversationId] ?? [];
    const hydratedList = list.map((entry) => ({
        ...entry,
        is_read: entry.sender_id === userId ? false : entry.is_read ?? true,
    }));

    const newMessage: DummyMessage = {
        message_id: Math.floor(Date.now() / 1000),
        conversation_id: conversationId,
        sender_id: userId,
        content,
        created_at: new Date(),
        first_name: "You",
        last_name: "",
        email: "you@example.com",
        pfp_url: null,
        is_read: false,
    };

    return [...hydratedList, newMessage];
};
