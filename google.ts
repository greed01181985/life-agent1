import { google } from 'googleapis';
import { v4 as uuid } from 'uuid';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/connections/google/callback';

// Scopes we need for Life Agent
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events', // create/update events
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose', // draft emails
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// In-memory token store (replace with DB in production)
// key = userId
export const tokenStore = new Map<
  string,
  {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    email?: string;
    name?: string;
  }
>();

export function createOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl(state: string) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force refresh_token
    scope: SCOPES,
    state,
  });
}

export async function handleCallback(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Get user profile
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: profile } = await oauth2.userinfo.get();

  return {
    tokens,
    email: profile.email || undefined,
    name: profile.name || undefined,
  };
}

export async function getAuthenticatedClient(userId: string) {
  const stored = tokenStore.get(userId);
  if (!stored) return null;

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    expiry_date: stored.expiry_date,
  });

  // Auto-refresh if needed
  client.on('tokens', (tokens) => {
    const current = tokenStore.get(userId);
    if (current) {
      tokenStore.set(userId, {
        ...current,
        access_token: tokens.access_token || current.access_token,
        expiry_date: tokens.expiry_date ?? current.expiry_date,
        refresh_token: tokens.refresh_token || current.refresh_token,
      });
    }
  });

  return client;
}

export async function getCalendarEvents(userId: string, timeMin?: string, timeMax?: string) {
  const auth = await getAuthenticatedClient(userId);
  if (!auth) throw new Error('Google not connected');

  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 7);

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin || now.toISOString(),
    timeMax: timeMax || end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 50,
  });

  return (res.data.items || []).map((event) => ({
    id: event.id,
    summary: event.summary || '(No title)',
    description: event.description,
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date,
    location: event.location,
    status: event.status,
    htmlLink: event.htmlLink,
    attendees: event.attendees?.map((a) => ({
      email: a.email,
      displayName: a.displayName,
      responseStatus: a.responseStatus,
    })),
  }));
}

export async function findConflicts(userId: string) {
  const events = await getCalendarEvents(userId);
  const conflicts: Array<{ a: any; b: any }> = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      if (!a.start || !a.end || !b.start || !b.end) continue;

      const aStart = new Date(a.start).getTime();
      const aEnd = new Date(a.end).getTime();
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();

      // Overlap check
      if (aStart < bEnd && bStart < aEnd) {
        conflicts.push({ a, b });
      }
    }
  }

  return conflicts;
}

export async function createCalendarEvent(
  userId: string,
  event: {
    summary: string;
    description?: string;
    start: string; // ISO
    end: string;
    attendees?: string[];
  }
) {
  const auth = await getAuthenticatedClient(userId);
  if (!auth) throw new Error('Google not connected');

  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
      attendees: event.attendees?.map((email) => ({ email })),
    },
  });

  return res.data;
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  updates: { start?: string; end?: string; summary?: string }
) {
  const auth = await getAuthenticatedClient(userId);
  if (!auth) throw new Error('Google not connected');

  const calendar = google.calendar({ version: 'v3', auth });

  // First get the existing event
  const existing = await calendar.events.get({
    calendarId: 'primary',
    eventId,
  });

  const res = await calendar.events.update({
    calendarId: 'primary',
    eventId,
    requestBody: {
      ...existing.data,
      summary: updates.summary ?? existing.data.summary,
      start: updates.start
        ? { dateTime: updates.start }
        : existing.data.start,
      end: updates.end ? { dateTime: updates.end } : existing.data.end,
    },
  });

  return res.data;
}

export async function createGmailDraft(
  userId: string,
  to: string,
  subject: string,
  body: string
) {
  const auth = await getAuthenticatedClient(userId);
  if (!auth) throw new Error('Google not connected');

  const gmail = google.gmail({ version: 'v1', auth });

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\n');

  const encoded = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: {
        raw: encoded,
      },
    },
  });

  return res.data;
}

export function isGoogleConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}
