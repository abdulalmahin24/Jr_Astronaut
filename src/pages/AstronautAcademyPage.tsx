import React from 'react';
import { AstronautAcademyModal } from '../components/AstronautAcademyModal';
import type { AppRoute } from '../router/useAppRouter';

export interface AstronautAcademyPageProps {
  initialTab?: any;
  completedMissions?: string[];
  onLaunchMission?: (missionId: string) => void;
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
}

export const AstronautAcademyPage: React.FC<AstronautAcademyPageProps> = ({
  initialTab = 'CURRICULUM',
  completedMissions = [],
  onLaunchMission,
  onNavigate,
}) => {
  return (
    <AstronautAcademyModal
      isOpen={true}
      isFullPage={true}
      onClose={() => onNavigate('home')}
      initialTab={initialTab}
      completedMissions={completedMissions}
      onLaunchMission={onLaunchMission}
      onOpenComics={() => onNavigate('learning', { tab: 'COMIC' })}
      onOpenClassroom={() => onNavigate('academy', { tab: 'CLASSROOM' })}
      onOpenDepot={() => onNavigate('academy', { tab: 'DEPOT' })}
    />
  );
};

export default AstronautAcademyPage;
