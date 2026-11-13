// ============================================================================
// HardcoreSurvivalModal.tsx — NASA 3D Spaceflight & Survival Missions Modal
// Launches the 3D Spaceflight & Orbital Rocket Simulator with 5 Hardcore Missions
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
  initialMissionId = 'kessler-syndrome',
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
