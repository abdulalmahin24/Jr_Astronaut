import React from 'react';
import type { AppRoute } from '../router/useAppRouter';
import { LearningHubModal } from '../components/LearningHubModal';
import type { MissionEvent } from '../types/game';
import type { TeachingFlashcard } from '../data/teachingFlashcards';

export interface LearningHubPageProps {
  initialTab?: 'NOTEBOOK' | 'MODELS_3D' | 'VIDEO' | 'AUDIO' | 'COMIC' | 'BRIEFINGS' | 'CATALOG';
  initialIssueId?: string;
  activeEvent: MissionEvent | null;
  collectedFlashcards?: TeachingFlashcard[];
  activeMissionId: string;
  onLaunchMission?: (missionId: string) => void;
  completedMissions?: string[];
  onOpenComicReader?: (issueId?: string) => void;
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
}

export const LearningHubPage: React.FC<LearningHubPageProps> = ({
  initialTab = 'NOTEBOOK',
  initialIssueId,
  activeEvent,
  collectedFlashcards,
  activeMissionId,
  onLaunchMission,
  completedMissions,
  onOpenComicReader,
  onNavigate,
}) => {
  return (
    <LearningHubModal
      isOpen={true}
      isFullPage={true}
      onClose={() => onNavigate('home')}
      initialTab={initialTab}
      initialIssueId={initialIssueId}
      activeEvent={activeEvent}
      collectedFlashcards={collectedFlashcards}
      activeMissionId={activeMissionId}
      onLaunchMission={onLaunchMission}
      completedMissions={completedMissions}
      onOpenComicReader={onOpenComicReader}
    />
  );
};

export default LearningHubPage;
