import express from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { TeamModel } from "../models/Team";
import { ConversationModel, MessageModel } from "../models/Messaging";

const router = express.Router();

router.use(authenticateToken);

router.get("/conversations", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.user_id;

    const team = await TeamModel.ensureTeamWithSamples(userId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    await ConversationModel.ensureDefaultConversation(team.team_id, userId);
    const conversations = await ConversationModel.getSummariesForUser(userId);

    res.json({ conversations });
  } catch (error) {
    console.error("Conversations fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:conversationId/messages", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const conversationId = parseInt(req.params.conversationId, 10);

    if (Number.isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation id" });
    }

    const isMember = await ConversationModel.isMember(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    const messages = await MessageModel.list(conversationId);
    await MessageModel.markRead(conversationId, userId);

    res.json({ messages });
  } catch (error) {
    console.error("Messages fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations/:conversationId/messages", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.user_id;
    const conversationId = parseInt(req.params.conversationId, 10);
    const { content } = req.body;

    if (Number.isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation id" });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const isMember = await ConversationModel.isMember(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    const messageId = await MessageModel.create(conversationId, userId, content.trim());
    if (!messageId) {
      return res.status(500).json({ error: "Failed to send message" });
    }

    const messages = await MessageModel.list(conversationId);
    res.status(201).json({ message: "Message sent", messages });
  } catch (error) {
    console.error("Message send error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
