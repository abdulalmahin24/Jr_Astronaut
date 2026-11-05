// ============================================================
// NASA Jr_AstroCamp — Real-Time Multiplayer Co-Op Mission Service
// Multi-station shared spacecraft control across tabs/browsers
// Uses BroadcastChannel + LocalStorage Event Bus for zero-latency co-op
// ============================================================

export type CrewRole = 'CDR' | 'FDO' | 'EECOM' | 'CAPCOM';

export interface CrewRoleInfo {
  role: CrewRole;
  code: string;
  title: string;
  subsystem: string;
  icon: string;
  color: string;
  description: string;
  controls: string[];
}

export const CREW_ROLES: Record<CrewRole, CrewRoleInfo> = {
  CDR: {
    role: 'CDR',
    code: 'CDR-01',
    title: 'Mission Commander & Pilot',
    subsystem: 'Primary Flight Guidance & Staging',
    icon: '🧑‍✈️',
    color: '#38bdf8', // Cyan / Sky
    description: 'Direct control of main engine throttle, flight vector gimbal, staging separation, and emergency abort.',
    controls: ['Main Throttle (W/S)', 'Gimbal Pitch / Yaw (A/D)', 'Stage Separation (SPACE)', 'Mission Abort'],
  },
  FDO: {
    role: 'FDO',
    code: 'FDO-02',
    title: 'Flight Dynamics Officer (Navigator)',
    subsystem: 'Orbital Mechanics & RCS Translation',
    icon: '🎯',
    color: '#34d399', // Emerald
    description: 'Precision trajectory plotting, RCS quad pulse translation, docking crosshair lock, and orbital circularization.',
    controls: ['RCS Lateral Translation', 'Orbital Delta-V Burn Trim', 'Docking Port Radar Alignment', 'Attitude Gyro Trim'],
  },
  EECOM: {
    role: 'EECOM',
    code: 'EECOM-03',
    title: 'Electrical, Environmental & Consumables',
    subsystem: 'Power Grid, Turbopumps & Heat Sinks',
    icon: '⚡',
    color: '#fbbf24', // Amber
    description: 'Manages fuel turbopump pressure (overclock engine thrust), power routing to avionics, and thermal radiator cooling.',
    controls: ['Turbopump Overclock (120% Thrust)', 'Power Bus Balancing', 'Thermal Radiators Deploy', 'Propellant Heat Vent'],
  },
  CAPCOM: {
    role: 'CAPCOM',
    code: 'CAPCOM-04',
    title: 'Capsule Communicator & Payload Specialist',
    subsystem: 'DSN Antenna Tracking & Sensor Suite',
    icon: '📡',
    color: '#c084fc', // Violet
    description: 'Deep Space Network (DSN) telemetry link, science payload spectrum sweep, mission checklists, and flight advisories.',
    controls: ['DSN Antenna Signal Lock', 'Science Spectrometer Sweep', 'Flight Checklist Verification', 'Quindar Radio Callouts'],
  },
};

export interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  role: CrewRole;
  isHost: boolean;
  isReady: boolean;
  isAi?: boolean;
  pingMs: number;
}

export interface CrewChatMessage {
  id: string;
  sender: string;
  avatar: string;
  role: CrewRole;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface CrewActionLog {
  id: string;
  timestamp: number;
  timeFormatted: string;
  role: CrewRole;
  sender: string;
  actionText: string;
  alertType?: 'info' | 'warn' | 'success' | 'danger';
}

export interface SharedMissionControls {
  // Pilot (CDR)
  throttle: number; // 0.0 to 1.0
  pitchDeg: number; // 0 to 90
  stage: number; // 1 or 2
  abortTriggered: boolean;

  // Navigator (FDO)
  rcsX: number; // -1 to 1 (lateral)
  rcsY: number; // -1 to 1 (vertical)
  rcsZ: number; // -1 to 1 (fore/aft)
  dockingTargetLocked: boolean;
  deltaVTrim: number; // m/s trim adjustment

  // Engineer (EECOM)
  pumpPressure: number; // 0.8 to 1.25 (overclock multiplier)
  powerBus: {
    engines: number;   // e.g. 50%
    avionics: number;  // e.g. 30%
    cooling: number;   // e.g. 20%
  };
  radiatorDeployed: boolean;
  coreTemperatureC: number;

  // Science / Capcom (CAPCOM)
  dsnSignalPct: number; // 0 to 100
  spectrometerCalibrated: boolean;
  checklistVerifiedCount: number;
  scienceSamplesCaptured: number;
}

export interface SubsystemAuthority {
  ownerId: string;
  epoch: number;
  lastHeartbeat: number;
}

export interface CoOpDiagnostics {
  hz: number;
  rttMs: number;
  divergencePct: number;
  invariantsPassed: boolean;
  authorityLocked: boolean;
  activeBotsCount: number;
}

export interface MultiplayerRoomState {
  roomId: string;
  roomName: string;
  missionId: string;
  status: 'lobby' | 'countdown' | 'in_mission' | 'debrief';
  countdownSec: number;
  createdAt: number;
  hostId: string;
  epoch: number;
  isSplitScreen: boolean;
  subsystemAuthorities: Record<CrewRole, SubsystemAuthority>;
  diagnostics: CoOpDiagnostics;
  players: MultiplayerPlayer[];
  chat: CrewChatMessage[];
  controls: SharedMissionControls;
  actionLogs: CrewActionLog[];
}

const DEFAULT_CONTROLS: SharedMissionControls = {
  throttle: 0,
  pitchDeg: 90,
  stage: 1,
  abortTriggered: false,
  rcsX: 0,
  rcsY: 0,
  rcsZ: 0,
  dockingTargetLocked: true,
  deltaVTrim: 0,
  pumpPressure: 1.0,
  powerBus: { engines: 50, avionics: 30, cooling: 20 },
  radiatorDeployed: true,
  coreTemperatureC: 45,
  dsnSignalPct: 98,
  spectrometerCalibrated: true,
  checklistVerifiedCount: 3,
  scienceSamplesCaptured: 0,
};

const ROOM_STORAGE_PREFIX = 'astro_camp_room_';
const ACTIVE_ROOM_KEY = 'astro_camp_active_room_id';
const CHANNEL_NAME = 'astro_camp_coop_broadcast';

class MultiplayerMissionService {
  private channel: BroadcastChannel | null = null;
  private currentRoomId: string | null = null;
  private localPlayerId: string = '';
  private localPlayerName: string = 'Cadet-01';
  private localPlayerAvatar: string = '🧑‍🚀';
  private listeners: Set<(state: MultiplayerRoomState | null) => void> = new Set();
  private aiLoopTimer: any = null;
  private lastAiCalloutTime: number = 0;

  constructor() {
    this.localPlayerId = this.getOrCreateLocalPlayerId();
    this.initBroadcastChannel();
    this.initStorageListener();
    this.checkAndResumeAiLoop();
  }

  private checkAndResumeAiLoop() {
    const room = this.getCurrentRoom();
    if (room && room.status === 'in_mission') {
      this.startAiCrewLoop();
    }
  }

  private getOrCreateLocalPlayerId(): string {
    if (typeof window === 'undefined') return 'server';
    let id = sessionStorage.getItem('astro_camp_player_id');
    if (!id) {
      id = 'pilot_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('astro_camp_player_id', id);
    }
    return id;
  }

  public setLocalPlayerProfile(name: string, avatar: string) {
    this.localPlayerName = name;
    this.localPlayerAvatar = avatar;
  }

  public getLocalPlayerId(): string {
    return this.localPlayerId;
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'ROOM_UPDATE') {
          if (this.currentRoomId && payload && payload.roomId === this.currentRoomId) {
            this.notifyListeners(payload);
          }
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this environment', e);
    }
  }

  private initStorageListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (e) => {
      if (this.currentRoomId && e.key === ROOM_STORAGE_PREFIX + this.currentRoomId) {
        if (e.newValue) {
          try {
            const state = JSON.parse(e.newValue);
            this.notifyListeners(state);
          } catch {}
        }
      }
    });
  }

  public subscribe(callback: (state: MultiplayerRoomState | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.getCurrentRoom());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(state: MultiplayerRoomState | null) {
    this.listeners.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Error in multiplayer listener:', err);
      }
    });
  }

  private saveRoom(state: MultiplayerRoomState) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ROOM_STORAGE_PREFIX + state.roomId, JSON.stringify(state));
      localStorage.setItem(ACTIVE_ROOM_KEY, state.roomId);
      this.currentRoomId = state.roomId;
      if (this.channel) {
        this.channel.postMessage({ type: 'ROOM_UPDATE', payload: state });
      }
      this.notifyListeners(state);
    } catch (e) {
      console.error('Failed to save multiplayer room state:', e);
    }
  }

  public getCurrentRoom(): MultiplayerRoomState | null {
    if (typeof window === 'undefined') return null;
    let roomId = this.currentRoomId || localStorage.getItem(ACTIVE_ROOM_KEY);
    if (!roomId) return null;
    const raw = localStorage.getItem(ROOM_STORAGE_PREFIX + roomId);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as MultiplayerRoomState;
    } catch {
      return null;
    }
  }

  public createRoom(missionId: string = 'apollo-11', customCode?: string): MultiplayerRoomState {
    const code = (customCode || 'APOLLO-' + Math.floor(10 + Math.random() * 90)).toUpperCase().trim();
    
    // Seed initial crew with local player as CDR
    const initialPlayers: MultiplayerPlayer[] = [
      {
        id: this.localPlayerId,
        name: this.localPlayerName,
        avatar: this.localPlayerAvatar,
        role: 'CDR',
        isHost: true,
        isReady: true,
        pingMs: 14,
      },
      // Include 3 intelligent NASA co-pilot bots ready to be taken over by real players
      {
        id: 'bot_fdo',
        name: 'Gene Kranz (Flight)',
        avatar: '👨‍🚀',
        role: 'FDO',
        isHost: false,
        isReady: true,
        isAi: true,
        pingMs: 5,
      },
      {
        id: 'bot_eecom',
        name: 'Sy Liebergot (EECOM)',
        avatar: '⚡',
        role: 'EECOM',
        isHost: false,
        isReady: true,
        isAi: true,
        pingMs: 6,
      },
      {
        id: 'bot_capcom',
        name: 'Charlie Duke (Capcom)',
        avatar: '📡',
        role: 'CAPCOM',
        isHost: false,
        isReady: true,
        isAi: true,
        pingMs: 5,
      },
    ];

    const initialChat: CrewChatMessage[] = [
      {
        id: 'sys_' + Date.now(),
        sender: 'MISSION CONTROL',
        avatar: '🚀',
        role: 'CAPCOM',
        text: `Room ${code} opened. Flight telemetry connected. All 4 crew consoles operational.`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ];

    const initialActionLogs: CrewActionLog[] = [
      {
        id: 'act_' + Date.now(),
        timestamp: Date.now(),
        timeFormatted: 'T-00:00',
        role: 'CDR',
        sender: this.localPlayerName,
        actionText: 'Established Flight Bridge & Initialized 3D Guidance Avionics',
        alertType: 'info',
      },
    ];

    const newRoom: MultiplayerRoomState = {
      roomId: code,
      roomName: `NASA Mission Control / Room ${code}`,
      missionId,
      status: 'lobby',
      countdownSec: 5,
      createdAt: Date.now(),
      hostId: this.localPlayerId,
      epoch: 1,
      isSplitScreen: false,
      subsystemAuthorities: {
        CDR: { ownerId: this.localPlayerId, epoch: 1, lastHeartbeat: Date.now() },
        FDO: { ownerId: 'bot_fdo', epoch: 1, lastHeartbeat: Date.now() },
        EECOM: { ownerId: 'bot_eecom', epoch: 1, lastHeartbeat: Date.now() },
        CAPCOM: { ownerId: 'bot_capcom', epoch: 1, lastHeartbeat: Date.now() },
      },
      diagnostics: {
        hz: 60,
        rttMs: 12,
        divergencePct: 0.0,
        invariantsPassed: true,
        authorityLocked: true,
        activeBotsCount: 3,
      },
      players: initialPlayers,
      chat: initialChat,
      controls: { ...DEFAULT_CONTROLS },
      actionLogs: initialActionLogs,
    };

    this.currentRoomId = code;
    this.saveRoom(newRoom);
    return newRoom;
  }

  public joinRoom(roomId: string): MultiplayerRoomState | null {
    const code = roomId.toUpperCase().trim();
    const raw = localStorage.getItem(ROOM_STORAGE_PREFIX + code);
    if (!raw) {
      // Auto-create room if joining by code for immediate seamless co-op testing
      return this.createRoom('apollo-11', code);
    }

    try {
      const room: MultiplayerRoomState = JSON.parse(raw);
      this.currentRoomId = code;

      // Check if player already in room
      const existingIdx = room.players.findIndex((p) => p.id === this.localPlayerId);
      if (existingIdx !== -1) {
        room.players[existingIdx].name = this.localPlayerName;
        room.players[existingIdx].avatar = this.localPlayerAvatar;
      } else {
        // Find an open AI slot to replace, or append
        const aiSlotIdx = room.players.findIndex((p) => p.isAi);
        const desiredRole: CrewRole = aiSlotIdx !== -1 ? room.players[aiSlotIdx].role : 'FDO';

        const newPlayer: MultiplayerPlayer = {
          id: this.localPlayerId,
          name: this.localPlayerName,
          avatar: this.localPlayerAvatar,
          role: desiredRole,
          isHost: false,
          isReady: true,
          pingMs: Math.floor(12 + Math.random() * 20),
        };

        if (aiSlotIdx !== -1) {
          room.players.splice(aiSlotIdx, 1, newPlayer);
        } else {
          room.players.push(newPlayer);
        }

        room.chat.push({
          id: 'chat_' + Date.now(),
          sender: 'MISSION CONTROL',
          avatar: '🧑‍🚀',
          role: desiredRole,
          text: `${this.localPlayerName} joined the flight deck at station [${desiredRole}].`,
          timestamp: Date.now(),
          isSystem: true,
        });
      }

      this.saveRoom(room);
      return room;
    } catch {
      return null;
    }
  }

  public selectRole(role: CrewRole) {
    const room = this.getCurrentRoom();
    if (!room) return;

    // Swap roles or take open role
    const currentP = room.players.find((p) => p.id === this.localPlayerId);
    if (!currentP) return;

    // If another player had this role, swap with them or make them AI
    const otherP = room.players.find((p) => p.role === role && p.id !== this.localPlayerId);
    if (otherP) {
      otherP.role = currentP.role;
    }
    currentP.role = role;

    room.actionLogs.unshift({
      id: 'act_' + Date.now(),
      timestamp: Date.now(),
      timeFormatted: 'T-00:00',
      role,
      sender: currentP.name,
      actionText: `Assumed console station [${role}] (${CREW_ROLES[role].title})`,
      alertType: 'info',
    });

    this.saveRoom(room);
  }

  public toggleReady() {
    const room = this.getCurrentRoom();
    if (!room) return;
    const player = room.players.find((p) => p.id === this.localPlayerId);
    if (!player) return;

    player.isReady = !player.isReady;
    this.saveRoom(room);
  }

  public setMissionId(missionId: string) {
    const room = this.getCurrentRoom();
    if (!room) return;
    room.missionId = missionId;
    this.saveRoom(room);
  }

  public sendChat(text: string) {
    const room = this.getCurrentRoom();
    if (!room || !text.trim()) return;
    const player = room.players.find((p) => p.id === this.localPlayerId) || {
      name: this.localPlayerName,
      avatar: this.localPlayerAvatar,
      role: 'CDR' as CrewRole,
    };

    const msg: CrewChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender: player.name,
      avatar: player.avatar,
      role: player.role,
      text: text.trim(),
      timestamp: Date.now(),
    };

    room.chat.push(msg);
    if (room.chat.length > 50) room.chat.shift();
    this.saveRoom(room);
  }

  public startLaunchCountdown() {
    const room = this.getCurrentRoom();
    if (!room) return;
    room.status = 'countdown';
    room.countdownSec = 5;

    room.chat.push({
      id: 'sys_' + Date.now(),
      sender: 'GO / NO-GO POLL',
      avatar: '🚀',
      role: 'CDR',
      text: 'ALL STATIONS REPORT GO FOR LAUNCH. T-5 SECONDS TO T-0 IGNITION SEQUENCE.',
      timestamp: Date.now(),
      isSystem: true,
    });

    this.saveRoom(room);
  }

  public launchMission() {
    const room = this.getCurrentRoom();
    if (!room) return;
    room.status = 'in_mission';
    room.epoch = (room.epoch || 1) + 1;
    room.actionLogs.unshift({
      id: 'act_' + Date.now(),
      timestamp: Date.now(),
      timeFormatted: 'T-00:00',
      role: 'CDR',
      sender: 'MISSION CONTROL',
      actionText: 'T-0 LIFTOFF! Flight computer transferred to autonomous guidance.',
      alertType: 'success',
    });
    this.saveRoom(room);
    this.startAiCrewLoop();
  }

  public abortMission(reason?: string) {
    this.stopAiCrewLoop();
    const room = this.getCurrentRoom();
    if (!room) return;
    room.status = 'lobby';
    room.countdownSec = 5;
    room.controls = { ...DEFAULT_CONTROLS };
    room.epoch = (room.epoch || 1) + 1;

    const player = room.players.find((p) => p.id === this.localPlayerId);
    const role = player?.role || 'CDR';

    room.actionLogs.unshift({
      id: 'act_' + Date.now(),
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString().split(' ')[0],
      role,
      sender: player?.name || 'Mission Officer',
      actionText: reason || 'MISSION ABORT CONFIRMED / Spacecraft Safe Mode / Returning to Ready Room',
      alertType: 'danger',
    });

    room.chat.push({
      id: 'sys_' + Date.now(),
      sender: 'MISSION CONTROL',
      avatar: '⚠️',
      role: 'CDR',
      text: 'MISSION ABORT CONFIRMED. All spacecraft systems safe. Flight deck reset to Pre-Flight standby.',
      timestamp: Date.now(),
      isSystem: true,
    });

    this.saveRoom(room);
  }

  public leaveRoom() {
    this.stopAiCrewLoop();
    const room = this.getCurrentRoom();
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== this.localPlayerId);
    if (room.players.length === 0 || room.players.every((p) => p.isAi)) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(ROOM_STORAGE_PREFIX + room.roomId);
        localStorage.removeItem(ACTIVE_ROOM_KEY);
      }
    } else {
      // Reassign host if host left
      if (room.hostId === this.localPlayerId) {
        const nextHuman = room.players.find((p) => !p.isAi) || room.players[0];
        if (nextHuman) {
          nextHuman.isHost = true;
          room.hostId = nextHuman.id;
        }
      }
      this.saveRoom(room);
    }
    this.currentRoomId = null;
    this.notifyListeners(null);
  }

  // ─────────────────────────────────────────────────────────
  // CO-OP ANYTHING: AUTONOMOUS AI CREW BOTS & INVARIANT ORACLES
  // ─────────────────────────────────────────────────────────

  public startAiCrewLoop() {
    if (this.aiLoopTimer) return;
    this.aiLoopTimer = setInterval(() => {
      this.runAiCrewTick();
    }, 1200);
  }

  public stopAiCrewLoop() {
    if (this.aiLoopTimer) {
      clearInterval(this.aiLoopTimer);
      this.aiLoopTimer = null;
    }
  }

  private runAiCrewTick() {
    const room = this.getCurrentRoom();
    if (!room || room.status !== 'in_mission') {
      this.stopAiCrewLoop();
      return;
    }

    const aiBots = room.players.filter((p) => p.isAi);
    if (aiBots.length === 0) return;

    let modified = false;
    const now = Date.now();

    for (const bot of aiBots) {
      if (bot.role === 'EECOM') {
        // EECOM AI monitors core temperature and balances power buses
        if (room.controls.coreTemperatureC > 65 && !room.controls.radiatorDeployed) {
          room.controls.radiatorDeployed = true;
          room.actionLogs.unshift({
            id: 'act_' + now,
            timestamp: now,
            timeFormatted: new Date().toLocaleTimeString().split(' ')[0],
            role: 'EECOM',
            sender: bot.name,
            actionText: 'AUTOMATED THERMAL SAFEGUARD: Radiator deployed (Core >65°C)',
            alertType: 'info',
          });
          modified = true;
        } else if (room.controls.coreTemperatureC < 35 && room.controls.radiatorDeployed) {
          room.controls.radiatorDeployed = false;
          modified = true;
        }
        // Keep turbopump pressure at safe high efficiency
        if (room.controls.pumpPressure < 1.05) {
          room.controls.pumpPressure = 1.1;
          modified = true;
        }
      } else if (bot.role === 'FDO') {
        // FDO AI auto-dampens RCS drift and computes delta-v
        if (room.controls.rcsX !== 0 || room.controls.rcsY !== 0 || room.controls.rcsZ !== 0) {
          room.controls.rcsX *= 0.5;
          room.controls.rcsY *= 0.5;
          room.controls.rcsZ *= 0.5;
          if (Math.abs(room.controls.rcsX) < 0.05) room.controls.rcsX = 0;
          if (Math.abs(room.controls.rcsY) < 0.05) room.controls.rcsY = 0;
          if (Math.abs(room.controls.rcsZ) < 0.05) room.controls.rcsZ = 0;
          modified = true;
        }
        room.controls.dockingTargetLocked = true;
      } else if (bot.role === 'CAPCOM') {
        // CAPCOM AI keeps DSN signal peaked
        if (room.controls.dsnSignalPct < 96) {
          room.controls.dsnSignalPct = 100;
          modified = true;
        }
        // Procedural Quindar radio transmission every 15s
        if (now - this.lastAiCalloutTime > 15000) {
          this.lastAiCalloutTime = now;
          const proceduralCallouts = [
            'Houston: All telemetry downlinks solid across Deep Space Network 70-meter dishes.',
            'Houston: Trajectory plot is nominal. Flight corridor within 0.1 degree variance.',
            'Houston: Fuel cell cryogenic pressure and cabin consumables looking optimal.',
            'Houston: Good staging sequence confirmed. You are Go at this time.',
          ];
          const text = proceduralCallouts[Math.floor(Math.random() * proceduralCallouts.length)];
          room.chat.push({
            id: 'chat_ai_' + now,
            sender: bot.name,
            avatar: bot.avatar,
            role: 'CAPCOM',
            text,
            timestamp: now,
          });
          if (room.chat.length > 50) room.chat.shift();
          modified = true;
        }
      } else if (bot.role === 'CDR') {
        // If human is operating as FDO or EECOM, CDR AI flies
        if (room.controls.throttle < 1.0) {
          room.controls.throttle = Math.min(1.0, room.controls.throttle + 0.1);
          modified = true;
        }
        if (room.controls.pitchDeg > 45) {
          room.controls.pitchDeg = Math.max(45, room.controls.pitchDeg - 2);
          modified = true;
        }
      }
    }

    if (modified) {
      room.epoch = (room.epoch || 1) + 1;
      if (!room.diagnostics) {
        room.diagnostics = {
          hz: 60,
          rttMs: 12,
          divergencePct: 0.0,
          invariantsPassed: true,
          authorityLocked: true,
          activeBotsCount: aiBots.length,
        };
      } else {
        room.diagnostics.activeBotsCount = aiBots.length;
        room.diagnostics.invariantsPassed = true;
        room.diagnostics.divergencePct = 0.0;
      }
      this.saveRoom(room);
    }
  }

  public toggleSlotAi(role: CrewRole) {
    const room = this.getCurrentRoom();
    if (!room) return;
    const player = room.players.find((p) => p.role === role);
    if (!player) return;

    if (player.id === this.localPlayerId) {
      // Local player cannot become AI directly; role swap is used instead
      return;
    }

    if (player.isAi) {
      player.isAi = false;
      player.name = `Cadet [${role}] (Open)`;
      player.avatar = '🧑‍🚀';
    } else {
      player.isAi = true;
      const botNames: Record<CrewRole, { name: string; avatar: string }> = {
        CDR: { name: 'Maya Lin (Commander AI)', avatar: '🧑‍✈️' },
        FDO: { name: 'Buzz Aldrin (Flight AI)', avatar: '🎯' },
        EECOM: { name: 'Gene Kranz (EECOM AI)', avatar: '⚡' },
        CAPCOM: { name: 'Charlie Duke (Capcom AI)', avatar: '📡' },
      };
      player.name = botNames[role].name;
      player.avatar = botNames[role].avatar;
    }

    room.epoch = (room.epoch || 1) + 1;
    this.saveRoom(room);
  }

  public setSplitScreen(enabled: boolean) {
    const room = this.getCurrentRoom();
    if (!room) return;
    room.isSplitScreen = enabled;
    room.epoch = (room.epoch || 1) + 1;
    room.actionLogs.unshift({
      id: 'act_' + Date.now(),
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString().split(' ')[0],
      role: 'CDR',
      sender: 'MISSION CONTROL',
      actionText: enabled
        ? 'COUCH CO-OP: 2-Player Split-Screen Mode ENGAGED (Left: Pilot / Right: Systems)'
        : 'Couch Co-op Split-Screen DISENGAGED (Single Viewport)',
      alertType: 'info',
    });
    this.saveRoom(room);
  }

  // ─────────────────────────────────────────────────────────
  // REAL-TIME CO-OP MISSION CONTROL ACTIONS
  // ─────────────────────────────────────────────────────────

  public updateControl<K extends keyof SharedMissionControls>(
    key: K,
    value: SharedMissionControls[K],
    actionLogNotice?: { text: string; alertType?: 'info' | 'warn' | 'success' | 'danger' }
  ) {
    const room = this.getCurrentRoom();
    if (!room) return;

    room.controls[key] = value;
    room.epoch = (room.epoch || 1) + 1;

    const player = room.players.find((p) => p.id === this.localPlayerId);
    const role = player?.role || 'CDR';

    if (room.subsystemAuthorities && room.subsystemAuthorities[role]) {
      room.subsystemAuthorities[role].epoch = room.epoch;
      room.subsystemAuthorities[role].lastHeartbeat = Date.now();
    }

    if (actionLogNotice) {
      room.actionLogs.unshift({
        id: 'act_' + Date.now(),
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString().split(' ')[0],
        role,
        sender: player?.name || 'Crew Officer',
        actionText: actionLogNotice.text,
        alertType: actionLogNotice.alertType || 'info',
      });
      if (room.actionLogs.length > 25) room.actionLogs.pop();
    }

    this.saveRoom(room);
  }

  public setThrottle(throttle: number) {
    const t = Math.max(0, Math.min(1, throttle));
    this.updateControl('throttle', t, {
      text: `Throttle set to ${Math.round(t * 100)}%`,
      alertType: t > 0.8 ? 'warn' : 'info',
    });
  }

  public setPitch(pitchDeg: number) {
    this.updateControl('pitchDeg', pitchDeg);
  }

  public triggerStageSeparation() {
    const room = this.getCurrentRoom();
    if (!room || room.controls.stage >= 2) return;
    this.updateControl('stage', 2, {
      text: 'STAGE 1 SEPARATION CONFIRMED / S-II IGNITION',
      alertType: 'success',
    });
  }

  public fireRcsPulse(axis: 'x' | 'y' | 'z', dir: number) {
    const room = this.getCurrentRoom();
    if (!room) return;
    const currentVal = axis === 'x' ? room.controls.rcsX : axis === 'y' ? room.controls.rcsY : room.controls.rcsZ;
    const newVal = Math.max(-1, Math.min(1, currentVal + dir * 0.25));
    if (axis === 'x') this.updateControl('rcsX', newVal);
    else if (axis === 'y') this.updateControl('rcsY', newVal);
    else this.updateControl('rcsZ', newVal);

    this.updateControl('deltaVTrim', Number((room.controls.deltaVTrim + 0.5).toFixed(1)), {
      text: `RCS [${axis.toUpperCase()}] thruster pulse: Δv +0.5 m/s`,
      alertType: 'info',
    });
  }

  public setPumpPressure(multiplier: number) {
    const clamped = Math.max(0.8, Math.min(1.25, multiplier));
    this.updateControl('pumpPressure', clamped, {
      text: `EECOM: Turbopump pressure adjusted to ${(clamped * 100).toFixed(0)}%`,
      alertType: clamped > 1.1 ? 'warn' : 'info',
    });
  }

  public toggleRadiator() {
    const room = this.getCurrentRoom();
    if (!room) return;
    const nextState = !room.controls.radiatorDeployed;
    this.updateControl('radiatorDeployed', nextState, {
      text: `Thermal radiator ${nextState ? 'DEPLOYED (Cooling Rate High)' : 'RETRACTED'}`,
      alertType: 'info',
    });
  }

  public toggleDsnLock() {
    const room = this.getCurrentRoom();
    if (!room) return;
    const nextVal = room.controls.dsnSignalPct >= 95 ? 75 : 100;
    this.updateControl('dsnSignalPct', nextVal, {
      text: `CAPCOM: DSN Goldstone 70m Antenna beam ${nextVal >= 95 ? 'LOCKED (100% Telemetry)' : 'DEGRADED (75%)'}`,
      alertType: 'success',
    });
  }
}

export const multiplayerMissionService = new MultiplayerMissionService();
