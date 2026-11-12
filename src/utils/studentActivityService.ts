// ============================================================
// NASA Jr_AstroCamp — Real-Time Student Mission Activity Tracker
// Tracks who completed what mission, exact timestamp, time taken, XP & Coins
// ============================================================

export type ActionCategory = 
  | 'MISSION_COMPLETED' 
  | 'SOL_SURVIVED' 
  | 'EXAM_PASSED' 
  | 'EQUIPMENT_PURCHASED' 
  | 'CHARACTER_UNLOCKED';

export interface StudentActivityLog {
  id: string;
  timestamp: number; // epoch ms
  isoTime: string;
  formattedTime: string; // e.g., "20:45:12"
  formattedDate: string; // e.g., "Oct 20, 2026"
  timeAgo: string; // e.g., "3m ago"
  studentUsername: string;
  studentFullName: string;
  studentAvatar: string;
  characterName: string;
  actionType: ActionCategory;
  missionTitle: string;
  destination: 'MOON' | 'MARS' | 'EARTH' | 'DEEP_SPACE' | 'CAMPUS';
  durationSeconds?: number;
  durationFormatted?: string; // e.g., "04m 18s"
  scoreXp: number; // e.g., +180 XP
  coinsEarned: number; // e.g., +250 Coins
  outcomeStatus: 'SUCCESS' | 'EXCELLENT' | 'NOMINAL' | 'PURCHASED' | 'UNLOCKED';
  notes?: string;
}

const STORAGE_KEY_ACTIVITY = 'astro_camp_realtime_activity_logs';

// Helper to format duration
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

// Helper to format date & time
export function formatTimeComponents(timestamp: number) {
  const d = new Date(timestamp);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  const formattedTime = `${hours}:${minutes}:${seconds}`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  let timeAgo = 'Just now';
  if (diffSec >= 3600) {
    const hoursAgo = Math.floor(diffSec / 3600);
    timeAgo = `${hoursAgo}h ago`;
  } else if (diffSec >= 60) {
    const minsAgo = Math.floor(diffSec / 60);
    timeAgo = `${minsAgo}m ago`;
  } else if (diffSec > 5) {
    timeAgo = `${diffSec}s ago`;
  }

  return { formattedTime, formattedDate, timeAgo, isoTime: d.toISOString() };
}

// Generate realistic seeded recent mission completions
function generateDefaultLogs(): StudentActivityLog[] {
  const now = Date.now();

  const presets = [
    {
      offsetMs: 3 * 60 * 1000, // 3 min ago
      studentUsername: 'LeoVance',
      studentFullName: 'Leo Vance',
      studentAvatar: '🚀',
      characterName: 'Buzz Aldrin',
      actionType: 'MISSION_COMPLETED' as ActionCategory,
      missionTitle: 'Apollo 11: Tranquility Base Manual Touchdown',
      destination: 'MOON' as const,
      durationSeconds: 252,
      scoreXp: 180,
      coinsEarned: 220,
      outcomeStatus: 'EXCELLENT' as const,
      notes: 'Calmly navigated boulder field with 18% fuel margin.',
    },
    {
      offsetMs: 14 * 60 * 1000, // 14 min ago
      studentUsername: 'MayaLin',
      studentFullName: 'Maya Lin',
      studentAvatar: '👩‍🚀',
      characterName: 'Kalpana Chawla',
      actionType: 'EXAM_PASSED' as ActionCategory,
      missionTitle: 'Earth Ground School: Advanced Orbital Mechanics Exam',
      destination: 'EARTH' as const,
      durationSeconds: 165,
      scoreXp: 150,
      coinsEarned: 200,
      outcomeStatus: 'SUCCESS' as const,
      notes: 'Scored 98% with 0 orbital transfer calculation errors.',
    },
    {
      offsetMs: 28 * 60 * 1000, // 28 min ago
      studentUsername: 'CadetArtemis',
      studentFullName: 'Artemis Junior',
      studentAvatar: '👨‍🚀',
      characterName: 'Neil Armstrong',
      actionType: 'SOL_SURVIVED' as ActionCategory,
      missionTitle: 'Sol 1 Shackleton Base: Oxygen Closed-Loop Sabatier Run',
      destination: 'MOON' as const,
      durationSeconds: 410,
      scoreXp: 220,
      coinsEarned: 300,
      outcomeStatus: 'SUCCESS' as const,
      notes: 'Kept base power positive (+18 kW) through cold lunar cycle.',
    },
    {
      offsetMs: 45 * 60 * 1000, // 45 min ago
      studentUsername: 'ZaynTariq',
      studentFullName: 'Zayn Tariq',
      studentAvatar: '🪐',
      characterName: 'Yuri Gagarin',
      actionType: 'MISSION_COMPLETED' as ActionCategory,
      missionTitle: 'Mars 2020: 7 Minutes of Terror Entry Descent Landing',
      destination: 'MARS' as const,
      durationSeconds: 420,
      scoreXp: 250,
      coinsEarned: 350,
      outcomeStatus: 'EXCELLENT' as const,
      notes: 'Sky Crane tether separation executed with zero deviation.',
    },
    {
      offsetMs: 72 * 60 * 1000, // 1h 12m ago
      studentUsername: 'NovaChen',
      studentFullName: 'Nova Chen',
      studentAvatar: '🌟',
      characterName: 'Kalpana Chawla',
      actionType: 'CHARACTER_UNLOCKED' as ActionCategory,
      missionTitle: 'Unlocked Historic Astronaut: Kalpana Chawla',
      destination: 'CAMPUS' as const,
      durationSeconds: 0,
      scoreXp: 50,
      coinsEarned: 0,
      outcomeStatus: 'UNLOCKED' as const,
      notes: 'Equipped Spartan Robotics Mastery perk (+25% Science).',
    },
    {
      offsetMs: 95 * 60 * 1000, // 1h 35m ago
      studentUsername: 'TaraSharma',
      studentFullName: 'Tara Sharma',
      studentAvatar: '🛰️',
      characterName: 'Sunita Williams',
      actionType: 'EQUIPMENT_PURCHASED' as ActionCategory,
      missionTitle: 'Purchased MOXIE Solid-Oxide Oxygen Extractor',
      destination: 'CAMPUS' as const,
      durationSeconds: 0,
      scoreXp: 40,
      coinsEarned: 0,
      outcomeStatus: 'PURCHASED' as const,
      notes: 'Installed into Shackleton Outpost Life Support Bay.',
    },
  ];

  return presets.map((p, idx) => {
    const ts = now - p.offsetMs;
    const { formattedTime, formattedDate, timeAgo, isoTime } = formatTimeComponents(ts);
    return {
      id: `act-seed-${idx}-${ts}`,
      timestamp: ts,
      isoTime,
      formattedTime,
      formattedDate,
      timeAgo,
      studentUsername: p.studentUsername,
      studentFullName: p.studentFullName,
      studentAvatar: p.studentAvatar,
      characterName: p.characterName,
      actionType: p.actionType,
      missionTitle: p.missionTitle,
      destination: p.destination,
      durationSeconds: p.durationSeconds,
      durationFormatted: p.durationSeconds ? formatDuration(p.durationSeconds) : 'Instant',
      scoreXp: p.scoreXp,
      coinsEarned: p.coinsEarned,
      outcomeStatus: p.outcomeStatus,
      notes: p.notes,
    };
  });
}

// Activity listeners callback type
type ActivityListener = (logs: StudentActivityLog[]) => void;
const listeners: Set<ActivityListener> = new Set();

export const studentActivityService = {
  // Get all logs, dynamically updating their relative timeAgo
  getLogs(): StudentActivityLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVITY);
      let logs: StudentActivityLog[];
      if (!stored) {
        logs = generateDefaultLogs();
        localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(logs));
      } else {
        logs = JSON.parse(stored);
      }

      // Update timeAgo dynamically based on current time
      return logs.map((log) => {
        const { timeAgo } = formatTimeComponents(log.timestamp);
        return { ...log, timeAgo };
      }).sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return generateDefaultLogs();
    }
  },

  // Save logs to storage
  saveLogs(logs: StudentActivityLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(logs));
      // Notify all active subscribers (e.g. modals, dashboards)
      listeners.forEach((fn) => fn(logs));
    } catch (e) {
      console.warn('Failed to save activity logs', e);
    }
  },

  // Log a new live real-time activity with timestamp
  logActivity(data: {
    studentUsername: string;
    studentFullName: string;
    studentAvatar: string;
    characterName?: string;
    actionType: ActionCategory;
    missionTitle: string;
    destination?: 'MOON' | 'MARS' | 'EARTH' | 'DEEP_SPACE' | 'CAMPUS';
    durationSeconds?: number;
    scoreXp?: number;
    coinsEarned?: number;
    outcomeStatus?: 'SUCCESS' | 'EXCELLENT' | 'NOMINAL' | 'PURCHASED' | 'UNLOCKED';
    notes?: string;
  }): StudentActivityLog {
    const ts = Date.now();
    const { formattedTime, formattedDate, timeAgo, isoTime } = formatTimeComponents(ts);

    const newLog: StudentActivityLog = {
      id: `act-${ts}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: ts,
      isoTime,
      formattedTime,
      formattedDate,
      timeAgo,
      studentUsername: data.studentUsername,
      studentFullName: data.studentFullName,
      studentAvatar: data.studentAvatar,
      characterName: data.characterName || 'Neil Armstrong',
      actionType: data.actionType,
      missionTitle: data.missionTitle,
      destination: data.destination || 'MOON',
      durationSeconds: data.durationSeconds || 0,
      durationFormatted: data.durationSeconds ? formatDuration(data.durationSeconds) : 'Instant',
      scoreXp: data.scoreXp || 100,
      coinsEarned: data.coinsEarned || 150,
      outcomeStatus: data.outcomeStatus || 'SUCCESS',
      notes: data.notes,
    };

    const currentLogs = this.getLogs();
    const updatedLogs = [newLog, ...currentLogs].slice(0, 50); // Keep last 50 real-time records
    this.saveLogs(updatedLogs);

    return newLog;
  },

  // Filter logs for a specific student
  getStudentLogs(username: string): StudentActivityLog[] {
    const all = this.getLogs();
    return all.filter((l) => l.studentUsername.toLowerCase() === username.toLowerCase());
  },

  // Subscribe to real-time events
  subscribe(listener: ActivityListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
