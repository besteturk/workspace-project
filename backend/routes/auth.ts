import express from 'express';
import { UserModel } from '../models/User';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { TeamModel } from '../models/Team';
import { EventModel } from '../models/Event';
import { ConversationModel } from '../models/Messaging';
import { isDatabaseDisabled } from '../config/database';
import { isMockAuthEnabled, mockUserCredentials, mockUserProfile } from '../config/mockUser';

const router = express.Router();

const buildMockUserPayload = () => ({
  user_id: mockUserProfile.user_id,
  first_name: mockUserProfile.first_name,
  last_name: mockUserProfile.last_name,
  email: mockUserProfile.email,
  pfp_url: mockUserProfile.pfp_url,
  role: mockUserProfile.role,
  job_title: mockUserProfile.job_title,
  location: mockUserProfile.location,
  bio: mockUserProfile.bio,
});

const buildMockAuthResponse = () => ({
  message: 'Login successful (mock mode)',
  user: buildMockUserPayload(),
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    if (isMockAuthEnabled) {
      return res.status(503).json({
        error: 'Registration is disabled while DB_DISABLE=true. Disable mock mode to register real users.',
      });
    }

    const { first_name, last_name, email, password, pfp_url } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields: first_name, last_name, email, password',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create user
    const userId = await UserModel.create({
      first_name,
      last_name,
      email,
      password,
      pfp_url,
      role: 'user',
    });

    if (!userId) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Get created user (without password)
    const newUser = await UserModel.findById(userId);
    if (!newUser) {
      return res.status(500).json({ error: 'User created but could not be retrieved' });
    }

    // Generate token
    const token = generateToken({
      user_id: newUser.user_id,
      email: newUser.email,
      role: newUser.role,
    });

    const team = await TeamModel.ensureTeamWithSamples(newUser.user_id);
    if (team) {
      await EventModel.ensureSampleEvents(team.team_id, newUser.user_id);
      await ConversationModel.ensureDefaultConversation(team.team_id, newUser.user_id);
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        user_id: newUser.user_id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        pfp_url: newUser.pfp_url,
        role: newUser.role,
        job_title: newUser.job_title,
        location: newUser.location,
        bio: newUser.bio,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (isMockAuthEnabled) {
      if (email === mockUserCredentials.email && password === mockUserCredentials.password) {
        const token = generateToken({
          user_id: mockUserProfile.user_id,
          email: mockUserProfile.email,
          role: mockUserProfile.role,
        });

        return res.json({
          ...buildMockAuthResponse(),
          token,
        });
      }

      return res.status(401).json({ error: 'Invalid email or password (mock mode)' });
    }

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    if (!isDatabaseDisabled) {
      const team = await TeamModel.ensureTeamWithSamples(user.user_id);
      if (team) {
        await EventModel.ensureSampleEvents(team.team_id, user.user_id);
        await ConversationModel.ensureDefaultConversation(team.team_id, user.user_id);
      }
    }

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        pfp_url: user.pfp_url,
        role: user.role,
        job_title: user.job_title,
        location: user.location,
        bio: user.bio,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (isMockAuthEnabled) {
      return res.json({
        user: {
          ...buildMockUserPayload(),
          created_at: new Date(),
        },
      });
    }

    const user = await UserModel.findById(req.user!.user_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        pfp_url: user.pfp_url,
        role: user.role,
        job_title: user.job_title,
        location: user.location,
        bio: user.bio,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (isMockAuthEnabled) {
      return res.status(503).json({
        error: 'Profile updates are disabled while DB_DISABLE=true. Disable mock mode to persist changes.',
      });
    }

    const userId = req.user!.user_id;
    const { first_name, last_name, pfp_url, job_title, location, bio } = req.body;

    const success = await UserModel.updateProfile(userId, {
      first_name,
      last_name,
      pfp_url,
      job_title,
      location,
      bio,
    });

    if (!success) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found after update' });
    }

    res.json({
      message: 'Profile updated',
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        pfp_url: user.pfp_url,
        role: user.role,
        job_title: user.job_title,
        location: user.location,
        bio: user.bio,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
