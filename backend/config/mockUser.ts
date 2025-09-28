import { isDatabaseDisabled } from './database';

const parseRole = (value?: string | null): 'user' | 'admin' => {
  if (value && value.toLowerCase() === 'admin') {
    return 'admin';
  }

  return 'user';
};

const toNumber = (value?: string | null, fallback = 900000): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const mockUserProfile = {
  user_id: toNumber(process.env.MOCK_USER_ID, 900000),
  first_name: process.env.MOCK_USER_FIRST_NAME || 'Demo',
  last_name: process.env.MOCK_USER_LAST_NAME || 'User',
  email: process.env.MOCK_USER_EMAIL || 'demo@example.com',
  pfp_url: process.env.MOCK_USER_PFP_URL || null,
  role: parseRole(process.env.MOCK_USER_ROLE),
  job_title: process.env.MOCK_USER_JOB_TITLE || null,
  location: process.env.MOCK_USER_LOCATION || null,
  bio: process.env.MOCK_USER_BIO || null,
} as const;

export const mockUserCredentials = {
  email: mockUserProfile.email,
  password: process.env.MOCK_USER_PASSWORD || 'demo123',
} as const;

export const isMockAuthEnabled = isDatabaseDisabled;
