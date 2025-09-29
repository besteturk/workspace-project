import express from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { TeamModel } from "../models/Team";
import { EventModel } from "../models/Event";
import { isDatabaseDisabled } from "../config/database";
import { getDummyTeam } from "../dummy-data/teams";
import { createDummyEvent, getDummyEvents } from "../dummy-data/events";

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.user_id;

    if (isDatabaseDisabled) {
      const team = getDummyTeam(userId);
      const events = getDummyEvents(team.team_id, userId);
      return res.json({ events });
    }

    const team = await TeamModel.ensureTeamWithSamples(userId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    await EventModel.ensureSampleEvents(team.team_id, userId);
    const events = await EventModel.findByTeamId(team.team_id);

    res.json({ events });
  } catch (error) {
    console.error("Events fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const { title, description, start_time, end_time, assigned_to_user_id } = req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ error: "Title, start_time and end_time are required" });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid start or end time" });
    }

    if (end <= start) {
      return res.status(400).json({ error: "End time must be after start time" });
    }

    if (isDatabaseDisabled) {
      const team = getDummyTeam(userId);
      const events = createDummyEvent(team.team_id, userId, {
        title,
        description: description ?? null,
        start,
        end,
        assigned_to_user_id: assigned_to_user_id ?? null,
      });

      return res.status(201).json({ message: "Event created (mock)", events });
    }

    const team = await TeamModel.ensureTeamWithSamples(userId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const eventId = await EventModel.create({
      team_id: team.team_id,
      title,
      description: description ?? null,
      start_time: start,
      end_time: end,
      assigned_to_user_id: assigned_to_user_id ?? null,
      created_by: userId,
    });

    if (!eventId) {
      return res.status(500).json({ error: "Failed to create event" });
    }

    const events = await EventModel.findByTeamId(team.team_id);

    res.status(201).json({ message: "Event created", events });
  } catch (error) {
    console.error("Event creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
