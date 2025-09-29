import express from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { TeamModel } from "../models/Team";
import { isDatabaseDisabled } from "../config/database";
import { getDummyTeam, getDummyTeamMembers } from "../dummy-data/teams";

const router = express.Router();

router.use(authenticateToken);

router.get("/current", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.user_id;

    if (isDatabaseDisabled) {
      const team = getDummyTeam(userId);
      const members = getDummyTeamMembers(userId);
      return res.json({ team, members });
    }

    const team = await TeamModel.ensureTeamWithSamples(userId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const members = await TeamModel.getMembers(team.team_id);

    res.json({ team, members });
  } catch (error) {
    console.error("Team fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
