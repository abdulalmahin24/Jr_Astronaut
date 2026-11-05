// ============================================================
// NASA Jr_AstroCamp — Authentication & User Role Types
// Supports Cadet (Username + Password) & Teacher (Email + Username + Password)
// ============================================================

export type UserRole = 'cadet' | 'teacher';

export interface User {
  id: string;
  username: string;
  password: string; // Stored in client-side secure store
  role: UserRole;
  email?: string; // Required for teachers, optional for cadets
  fullName?: string;
  schoolOrOrg?: string; // School or educational institute
  avatar: string;
  cadetRank: string; // e.g., 'Flight Candidate', 'Mission Specialist', 'Commander'
  coins: number; // In-game currency earned from missions
  selectedCharacterId?: string; // e.g., 'neil_armstrong'
  unlockedCharacterIds?: string[]; // IDs of unlocked historic astronaut characters
  completedMissions?: string[]; // IDs of completed missions
  purchasedEquipments?: string[]; // IDs of owned equipment
  createdAt: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  role: UserRole;
  email?: string;
  fullName?: string;
  schoolOrOrg?: string;
  avatar?: string;
}

export interface LoginPayload {
  identifier: string; // Username or Email (for teachers)
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}
