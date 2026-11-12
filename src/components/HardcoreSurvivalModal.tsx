// ============================================================================
// HardcoreSurvivalModal.tsx — Hardcore Survival Missions Modal Wrapper
// Clean modal mount for the 5-Mission 3D Spaceflight & Orbital Simulator
// ============================================================================

import React from 'react';
import { HardcoreSurvivalSimulator } from './HardcoreSurvivalSimulator';
import type { HardcoreMissionId } from '../missions/survivalMissions';

interface HardcoreSurvivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMissionId?: HardcoreMissionId;
  onMissionCompleted?: (missionId: HardcoreMissionId, credits: number) => void;
}

export const HardcoreSurvivalModal: React.FC<HardcoreSurvivalModalProps> = ({
  isOpen,
  onClose,
  initialMissionId,
  onMissionCompleted,
}) => {
  if (!isOpen) return null;

  return (
    <HardcoreSurvivalSimulator
      initialMissionId={initialMissionId}
      onClose={onClose}
      onMissionCompleted={onMissionCompleted}
    />
  );
};
