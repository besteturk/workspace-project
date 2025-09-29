import { apiRequest } from "@/lib/api";

export interface ApiUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  pfp_url?: string | null;
  role: string;
  job_title?: string | null;
  location?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: ApiUser;
}

export interface ProfileResponse {
  user: ApiUser;
}

export interface Pagination {
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface NoteSummary {
  note_id: number;
  noter_id?: number;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  termination_marked?: boolean;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface NotesListResponse {
  notes: NoteSummary[];
  pagination: Pagination;
}

export interface SingleNoteResponse {
  note: NoteSummary;
}

export type CreateNotePayload = {
  title?: string;
  content: string;
} & Record<string, unknown>;

export type UpdateNotePayload = {
  title?: string;
  content?: string;
} & Record<string, unknown>;

export interface TeamSummary {
  team_id: number;
  name: string;
  description: string | null;
  created_by: number;
  created_at: string;
}

export interface TeamMemberSummary {
  team_member_id: number;
  team_id: number;
  user_id: number;
  role: "member" | "admin";
  joined_at: string;
  first_name: string;
  last_name: string;
  email: string;
  pfp_url?: string | null;
  job_title?: string | null;
}

export interface CurrentTeamResponse {
  team: TeamSummary;
  members: TeamMemberSummary[];
}

export interface EventSummary {
  event_id: number;
  team_id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  assigned_to_user_id: number | null;
  created_by: number;
  created_at: string;
  assigned_first_name?: string;
  assigned_last_name?: string;
}

export interface EventsResponse {
  events: EventSummary[];
}

export interface ConversationsResponse {
  conversations: ConversationSummary[];
}

export interface ConversationSummary {
  conversation_id: number;
  title: string;
  is_direct: boolean;
  created_at: string;
  unread_count: number;
  last_message: ConversationMessageSummary | null;
  participants: ConversationParticipant[];
}

export interface ConversationParticipant {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  pfp_url?: string | null;
  job_title?: string | null;
}

export interface ConversationMessageSummary {
  message_id: number;
  content: string;
  created_at: string;
  sender: ConversationParticipant;
}

export interface MessagesResponse {
  messages: MessageSummary[];
}

export interface MessageSummary {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  pfp_url?: string | null;
  is_read?: boolean;
}

type RequestOptions = {
  signal?: AbortSignal;
};

type AuthRequestOptions = RequestOptions;
type NotesRequestOptions = RequestOptions;
type TeamRequestOptions = RequestOptions;
type EventsRequestOptions = RequestOptions;
type MessagingRequestOptions = RequestOptions;

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  pfp_url?: string;
};

export type UpdateProfilePayload = {
  first_name?: string;
  last_name?: string;
  pfp_url?: string | null;
  job_title?: string | null;
  location?: string | null;
  bio?: string | null;
} & Record<string, unknown>;

type ListMyNotesParams = {
  page?: number;
  limit?: number;
};

export type CreateEventPayload = {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  assigned_to_user_id?: number | null;
} & Record<string, unknown>;

export type SendMessagePayload = {
  content: string;
} & Record<string, unknown>;

export const api = {
  auth: {
    async login(payload: LoginPayload, options: AuthRequestOptions = {}): Promise<AuthResponse> {
      return apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: payload,
        auth: false,
        signal: options.signal,
      });
    },

    async register(payload: RegisterPayload, options: AuthRequestOptions = {}): Promise<AuthResponse> {
      return apiRequest<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: payload,
        auth: false,
        signal: options.signal,
      });
    },

    async profile(options: AuthRequestOptions = {}): Promise<ProfileResponse> {
      return apiRequest<ProfileResponse>("/api/auth/profile", {
        method: "GET",
        signal: options.signal,
      });
    },

    async updateProfile(payload: UpdateProfilePayload, options: AuthRequestOptions = {}): Promise<ProfileResponse> {
      return apiRequest<ProfileResponse>("/api/auth/profile", {
        method: "PUT",
        body: payload,
        signal: options.signal,
      });
    },
  },

  notes: {
    async listMyNotes(
      params: ListMyNotesParams = {},
      options: NotesRequestOptions = {}
    ): Promise<NotesListResponse> {
      const searchParams = new URLSearchParams();

      if (params.page) {
        searchParams.set("page", params.page.toString());
      }

      if (params.limit) {
        searchParams.set("limit", params.limit.toString());
      }

      const query = searchParams.toString();
      const endpoint = `/api/notes/my-notes${query ? `?${query}` : ""}`;

      return apiRequest<NotesListResponse>(endpoint, {
        method: "GET",
        signal: options.signal,
      });
    },

    async get(noteId: number, options: NotesRequestOptions = {}): Promise<SingleNoteResponse> {
      return apiRequest<SingleNoteResponse>(`/api/notes/${noteId}`, {
        method: "GET",
        signal: options.signal,
      });
    },

    async create(payload: CreateNotePayload, options: NotesRequestOptions = {}): Promise<SingleNoteResponse> {
      return apiRequest<SingleNoteResponse>("/api/notes", {
        method: "POST",
        body: payload,
        signal: options.signal,
      });
    },

    async update(
      noteId: number,
      payload: UpdateNotePayload,
      options: NotesRequestOptions = {}
    ): Promise<SingleNoteResponse> {
      return apiRequest<SingleNoteResponse>(`/api/notes/${noteId}`, {
        method: "PUT",
        body: payload,
        signal: options.signal,
      });
    },

    async remove(noteId: number, options: NotesRequestOptions = {}): Promise<{ message: string }> {
      return apiRequest<{ message: string }>(`/api/notes/${noteId}`, {
        method: "DELETE",
        signal: options.signal,
      });
    },
  },

  teams: {
    async getCurrent(options: TeamRequestOptions = {}): Promise<CurrentTeamResponse> {
      return apiRequest<CurrentTeamResponse>("/api/teams/current", {
        method: "GET",
        signal: options.signal,
      });
    },
  },

  events: {
    async list(options: EventsRequestOptions = {}): Promise<EventsResponse> {
      return apiRequest<EventsResponse>("/api/events", {
        method: "GET",
        signal: options.signal,
      });
    },

    async create(payload: CreateEventPayload, options: EventsRequestOptions = {}): Promise<EventsResponse> {
      return apiRequest<EventsResponse>("/api/events", {
        method: "POST",
        body: payload,
        signal: options.signal,
      });
    },
  },

  messaging: {
    async listConversations(options: MessagingRequestOptions = {}): Promise<ConversationsResponse> {
      return apiRequest<ConversationsResponse>("/api/messaging/conversations", {
        method: "GET",
        signal: options.signal,
      });
    },

    async listMessages(
      conversationId: number,
      options: MessagingRequestOptions = {}
    ): Promise<MessagesResponse> {
      return apiRequest<MessagesResponse>(`/api/messaging/conversations/${conversationId}/messages`, {
        method: "GET",
        signal: options.signal,
      });
    },

    async sendMessage(
      conversationId: number,
      payload: SendMessagePayload,
      options: MessagingRequestOptions = {}
    ): Promise<MessagesResponse> {
      return apiRequest<MessagesResponse>(`/api/messaging/conversations/${conversationId}/messages`, {
        method: "POST",
        body: payload,
        signal: options.signal,
      });
    },
  },
} as const;

export type ApiClient = typeof api;
