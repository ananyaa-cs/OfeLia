import Dexie, { Table } from 'dexie';

// ── Task ──────────────────────────────────────────
export interface Task {
  id?: number;
  text: string;
  scheduledTime: string;      // "9:00 AM"
  estimatedMinutes?: number;
  status: 'pending' | 'in-progress' | 'done';
  photoProofUrl?: string;     // base64 data URL of proof photo
  aiMessage?: string;         // OfeLia's message when creating this task
  createdAt: Date;
  completedAt?: Date;
}

// ── Chat Message ──────────────────────────────────
export interface ChatMessage {
  id?: number;
  role: 'user' | 'ofelia';
  content: string;
  timestamp: Date;
}

// ── User Profile ──────────────────────────────────
export interface UserProfile {
  id: string;           // 'profile'
  name: string;
  peakHours?: string;   // "morning" | "afternoon" | "night"
  onboardingDone: boolean;
  tutorialDone: boolean;
  createdAt: Date;
}

// ── Database ──────────────────────────────────────
export class OfeLiaDB extends Dexie {
  tasks!: Table<Task>;
  messages!: Table<ChatMessage>;
  profile!: Table<UserProfile>;

  constructor() {
    super('OfeLiaDB');
    this.version(1).stores({
      tasks: '++id, status, scheduledTime, createdAt',
      messages: '++id, role, timestamp',
      profile: 'id'
    });
  }
}

export const db = new OfeLiaDB();
