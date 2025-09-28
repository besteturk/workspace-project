import express from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { TeamModel } from "../models/Team";

const router = express.Router();

router.use(authenticateToken);

router.get("/current", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.user_id;

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
