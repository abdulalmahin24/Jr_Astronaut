// ============================================================================
// HardcoreSurvivalModal.tsx — NASA 3D Spaceflight & Survival Missions Modal
// Launches the Full-Screen Ellipse-Style Spaceflight Simulator
// ============================================================================

import React from 'react';
import { FullMissionLifecycleModal } from './FullMissionLifecycleModal';
import type { HardcoreMissionId } from '../missions/survivalMissions';
import type { ExpeditionDestination } from '../missions/fullMissionLifecycle';

interface HardcoreSurvivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMissionId?: HardcoreMissionId;
  onMissionCompleted?: (missionId: HardcoreMissionId, credits: number) => void;
}

export const HardcoreSurvivalModal: React.FC<HardcoreSurvivalModalProps> = ({
  isOpen,
  onClose,
  initialMissionId = 'lunar-voyager',
  onMissionCompleted,
}) => {
  if (!isOpen) return null;

  const dest: ExpeditionDestination =
    initialMissionId === 'mars-voyager' ? 'MARS' :
    initialMissionId === 'orbital-pioneer' ? 'ORBITAL' :
    initialMissionId === 'suborbital-pioneer' ? 'SUBORBITAL' : 'MOON';

  return (
    <FullMissionLifecycleModal
      isOpen={isOpen}
      onClose={onClose}
      initialDestination={dest}
      onMissionCompleted={(_dest, credits) => {
        onMissionCompleted?.(initialMissionId, credits);
      }}
    />
  );
};
