import type { TeamRow, TeamMemberRow } from "../models/Team";

const TEAM_ID = 700001;

const buildDummyTeam = (userId: number): TeamRow =>
({
    team_id: TEAM_ID,
    name: "Workspace Demo Team",
    description: "Auto-generated while the database is disabled",
    created_by: userId,
    created_at: new Date(),
} as unknown as TeamRow);

const buildDummyMembers = (userId: number): TeamMemberRow[] => {
    const members = [
        {
            team_member_id: 1,
            team_id: TEAM_ID,
            user_id: userId,
            role: "admin",
            joined_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            first_name: "You",
            last_name: "",
            email: "you@example.com",
            pfp_url: null,
            job_title: "Team Lead",
        },
        {
            team_member_id: 2,
            team_id: TEAM_ID,
            user_id: 200001,
            role: "member",
            joined_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            first_name: "Taylor",
            last_name: "Morgan",
            email: "taylor@example.com",
            pfp_url: null,
            job_title: "Product Manager",
        },
        {
            team_member_id: 3,
            team_id: TEAM_ID,
            user_id: 200002,
            role: "member",
            joined_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            first_name: "Jordan",
            last_name: "Lee",
            email: "jordan@example.com",
            pfp_url: null,
            job_title: "Designer",
        },
    ];

    return members.map((member) => member as unknown as TeamMemberRow);
};

export const getDummyTeam = (userId: number): TeamRow => buildDummyTeam(userId);

export const getDummyTeamMembers = (userId: number): TeamMemberRow[] => buildDummyMembers(userId);
