/**
 * studentScores.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Classroom Gradebook & Student Score Management System for Jr_AstroCamp.
 * Tracks cadet scores, exam outcomes, Sols survived, XP, and teacher directives.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface StudentScoreRecord {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rankLevel: number;
  rankTitle: string;
  totalXp: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'IN_TRAINING';
  solsCompleted: number;
  earthExamScore: string; // e.g. "4/4 (100%)"
  earthExamPassed: boolean;
  missionsCompleted: number;
  iceHarvestedKg: number;
  casualtiesCount: number;
  powerEfficiencyPct: number;
  lastActive: string;
  teacherNote?: string;
}

export interface ClassroomDirective {
  id: string;
  title: string;
  description: string;
  targetSol: number;
  xpReward: number;
  assignedDate: string;
  status: 'ACTIVE' | 'COMPLETED';
}

const STORAGE_KEY_CLASSROOM_STUDENTS = 'astro_camp_classroom_students';
const STORAGE_KEY_CLASSROOM_DIRECTIVES = 'astro_camp_classroom_directives';

const DEFAULT_STUDENTS: StudentScoreRecord[] = [
  {
    id: 'stud-1',
    name: 'Artemis Junior',
    username: 'CadetArtemis',
    avatar: '🚀',
    rankLevel: 4,
    rankTitle: 'Lunar Surface Navigator',
    totalXp: 1650,
    grade: 'A+',
    solsCompleted: 24,
    earthExamScore: '4/4 (100%)',
    earthExamPassed: true,
    missionsCompleted: 12,
    iceHarvestedKg: 380,
    casualtiesCount: 0,
    powerEfficiencyPct: 96,
    lastActive: '10 mins ago',
    teacherNote: 'Outstanding polar rover navigation and zero ECLSS casualties.'
  },
  {
    id: 'stud-2',
    name: 'Leo Vance',
    username: 'CadetLeo',
    avatar: '👨‍🚀',
    rankLevel: 3,
    rankTitle: 'Flight Engineer',
    totalXp: 980,
    grade: 'A',
    solsCompleted: 19,
    earthExamScore: '4/4 (100%)',
    earthExamPassed: true,
    missionsCompleted: 8,
    iceHarvestedKg: 240,
    casualtiesCount: 0,
    powerEfficiencyPct: 92,
    lastActive: '1 hour ago',
    teacherNote: 'Mastered Sabatier closed-loop thermodynamics.'
  },
  {
    id: 'stud-3',
    name: 'Maya Lin',
    username: 'CadetMaya',
    avatar: '👩‍🚀',
    rankLevel: 3,
    rankTitle: 'Flight Engineer',
    totalXp: 850,
    grade: 'A',
    solsCompleted: 16,
    earthExamScore: '3/4 (75%)',
    earthExamPassed: true,
    missionsCompleted: 7,
    iceHarvestedKg: 195,
    casualtiesCount: 0,
    powerEfficiencyPct: 89,
    lastActive: '3 hours ago',
    teacherNote: 'High scores in Houston NBL Spacewalk Pool simulations.'
  },
  {
    id: 'stud-4',
    name: 'Zayn Tariq',
    username: 'CadetZayn',
    avatar: '🛰️',
    rankLevel: 2,
    rankTitle: 'ASCAN Candidate',
    totalXp: 520,
    grade: 'B+',
    solsCompleted: 11,
    earthExamScore: '3/4 (75%)',
    earthExamPassed: true,
    missionsCompleted: 4,
    iceHarvestedKg: 90,
    casualtiesCount: 1,
    powerEfficiencyPct: 78,
    lastActive: 'Yesterday',
    teacherNote: 'Needs review on solar night battery conservation.'
  },
  {
    id: 'stud-5',
    name: 'Nova Chen',
    username: 'CadetNova',
    avatar: '🪐',
    rankLevel: 2,
    rankTitle: 'ASCAN Candidate',
    totalXp: 380,
    grade: 'B',
    solsCompleted: 7,
    earthExamScore: '3/4 (75%)',
    earthExamPassed: true,
    missionsCompleted: 3,
    iceHarvestedKg: 50,
    casualtiesCount: 0,
    powerEfficiencyPct: 82,
    lastActive: '2 days ago',
    teacherNote: 'Steady progress on Houston centrifuge resistance.'
  },
  {
    id: 'stud-6',
    name: 'Tara Sharma',
    username: 'CadetTara',
    avatar: '🔭',
    rankLevel: 1,
    rankTitle: 'Junior Stargazer',
    totalXp: 160,
    grade: 'IN_TRAINING',
    solsCompleted: 3,
    earthExamScore: 'Pending (In Prep)',
    earthExamPassed: false,
    missionsCompleted: 1,
    iceHarvestedKg: 15,
    casualtiesCount: 0,
    powerEfficiencyPct: 88,
    lastActive: 'Today',
    teacherNote: 'Read Comics 1-2; preparing for the ASCAN certification exam.'
  }
];

const DEFAULT_DIRECTIVES: ClassroomDirective[] = [
  {
    id: 'dir-1',
    title: 'NASA ASCAN Earth Qualifying Exam',
    description: 'All cadets must pass the 4-question Houston certification exam in the Astronaut Academy with at least 75%.',
    targetSol: 5,
    xpReward: 250,
    assignedDate: 'Oct 20, 2026',
    status: 'ACTIVE'
  },
  {
    id: 'dir-2',
    title: 'Survive the 354-Hour Lunar Night',
    description: 'Manage Kilopower 10 kWe nuclear reactors and conserve habitat battery banks across Sol 8 to Sol 14 with 0 casualties.',
    targetSol: 14,
    xpReward: 500,
    assignedDate: 'Oct 20, 2026',
    status: 'ACTIVE'
  },
  {
    id: 'dir-3',
    title: 'Polar Cryo-Ice Drilling Mission',
    description: 'Pilot the surface rover into Shackleton Crater and harvest a minimum of 100 kg of water ice using the Rotary Core Drill.',
    targetSol: 20,
    xpReward: 400,
    assignedDate: 'Oct 20, 2026',
    status: 'ACTIVE'
  }
];

export const studentScoreService = {
  getStudents(): StudentScoreRecord[] {
    try {
      if (typeof window === 'undefined') return DEFAULT_STUDENTS;
      const stored = localStorage.getItem(STORAGE_KEY_CLASSROOM_STUDENTS);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_CLASSROOM_STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
        return DEFAULT_STUDENTS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_STUDENTS;
    }
  },

  saveStudents(students: StudentScoreRecord[]): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CLASSROOM_STUDENTS, JSON.stringify(students));
      }
    } catch (e) {
      console.warn('Failed to save classroom students:', e);
    }
  },

  updateStudentNote(studentId: string, note: string): StudentScoreRecord[] {
    const students = this.getStudents();
    const updated = students.map((s) => s.id === studentId ? { ...s, teacherNote: note } : s);
    this.saveStudents(updated);
    return updated;
  },

  awardBonusXp(studentId: string, bonusXp: number): StudentScoreRecord[] {
    const students = this.getStudents();
    const updated = students.map((s) => {
      if (s.id === studentId) {
        const nextXp = s.totalXp + bonusXp;
        let grade: StudentScoreRecord['grade'] = s.grade;
        if (nextXp >= 1400) grade = 'A+';
        else if (nextXp >= 800) grade = 'A';
        else if (nextXp >= 500) grade = 'B+';
        else if (nextXp >= 300) grade = 'B';
        return { ...s, totalXp: nextXp, grade };
      }
      return s;
    });
    this.saveStudents(updated);
    return updated;
  },

  getDirectives(): ClassroomDirective[] {
    try {
      if (typeof window === 'undefined') return DEFAULT_DIRECTIVES;
      const stored = localStorage.getItem(STORAGE_KEY_CLASSROOM_DIRECTIVES);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY_CLASSROOM_DIRECTIVES, JSON.stringify(DEFAULT_DIRECTIVES));
        return DEFAULT_DIRECTIVES;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_DIRECTIVES;
    }
  },

  addDirective(title: string, description: string, targetSol = 10, xpReward = 300): ClassroomDirective[] {
    const directives = this.getDirectives();
    const newDir: ClassroomDirective = {
      id: `dir-${Date.now()}`,
      title,
      description,
      targetSol,
      xpReward,
      assignedDate: 'Today',
      status: 'ACTIVE'
    };
    const updated = [newDir, ...directives];
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CLASSROOM_DIRECTIVES, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Failed to save directive:', e);
    }
    return updated;
  }
};
