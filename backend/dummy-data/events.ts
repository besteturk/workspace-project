import type { EventRow } from "../models/Event";

const BASE_EVENT_IDS = [800001, 800002, 800003];

const buildBaseEvents = (teamId: number, userId: number): EventRow[] => {
    const now = Date.now();

    return [
        {
            event_id: BASE_EVENT_IDS[0],
            team_id: teamId,
            title: "Weekly standup",
            description: "Quick sync to cover blockers",
            start_time: new Date(now + 1 * 60 * 60 * 1000),
            end_time: new Date(now + 2 * 60 * 60 * 1000),
            assigned_to_user_id: userId,
            created_by: userId,
            created_at: new Date(now - 4 * 60 * 60 * 1000),
            assigned_first_name: "Taylor",
            assigned_last_name: "Morgan",
        },
        {
            event_id: BASE_EVENT_IDS[1],
            team_id: teamId,
            title: "Design review",
            description: "Walk through new onboarding flow",
            start_time: new Date(now + 4 * 60 * 60 * 1000),
            end_time: new Date(now + 5 * 60 * 60 * 1000),
            assigned_to_user_id: null,
            created_by: userId,
            created_at: new Date(now - 6 * 60 * 60 * 1000),
            assigned_first_name: undefined,
            assigned_last_name: undefined,
        },
        {
            event_id: BASE_EVENT_IDS[2],
            team_id: teamId,
            title: "Retro planning",
            description: "Prepare agenda for Friday",
            start_time: new Date(now + 24 * 60 * 60 * 1000),
            end_time: new Date(now + 25 * 60 * 60 * 1000),
            assigned_to_user_id: userId,
            created_by: userId,
            created_at: new Date(now - 12 * 60 * 60 * 1000),
            assigned_first_name: "Jordan",
            assigned_last_name: "Lee",
        },
    ].map((event) => event as unknown as EventRow);
};

export const getDummyEvents = (teamId: number, userId: number): EventRow[] =>
    buildBaseEvents(teamId, userId);

export const createDummyEvent = (
    teamId: number,
    userId: number,
    payload: { title: string; description?: string | null; start: Date; end: Date; assigned_to_user_id?: number | null }
): EventRow[] => {
    const base = buildBaseEvents(teamId, userId);
    const newEvent = {
        event_id: Math.floor(Date.now() / 1000),
        team_id: teamId,
        title: payload.title,
        description: payload.description ?? null,
        start_time: payload.start,
        end_time: payload.end,
        assigned_to_user_id: payload.assigned_to_user_id ?? null,
        created_by: userId,
        created_at: new Date(),
        assigned_first_name: payload.assigned_to_user_id ? "Taylor" : undefined,
        assigned_last_name: payload.assigned_to_user_id ? "Morgan" : undefined,
    } as unknown as EventRow;

    return [newEvent, ...base];
};
