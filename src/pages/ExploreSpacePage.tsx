import React from 'react';
import { LandingPage, type LandingPageProps } from '../components/LandingPage';
import type { AppRoute } from '../router/useAppRouter';

export interface ExploreSpacePageProps extends Omit<LandingPageProps, 'onEnter'> {
  onNavigate: (route: AppRoute, params?: Record<string, string>) => void;
}

export const ExploreSpacePage: React.FC<ExploreSpacePageProps> = ({
  onNavigate,
  onStartMission,
  onContinueMission,
  ...rest
}) => {
  return (
    <div
      className="page-explore-space"
      style={{
        width: '100%',
        height: 'calc(100vh - var(--header-height, 56px))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <LandingPage
        {...rest}
        mode="explore"
        onEnter={() => onNavigate('mission')}
        onStartMission={() => {
          if (onStartMission) onStartMission();
          onNavigate('mission');
        }}
        onContinueMission={() => {
          if (onContinueMission) onContinueMission();
          onNavigate('mission');
        }}
        onBuildOutpost={(dest, diff) => {
          onNavigate('mission', { dest, ...(diff ? { diff } : {}) });
        }}
        onOpenAcademy={() => onNavigate('academy')}
        onOpenSpaceGamesHub={() => onNavigate('simulators')}
        onOpenMarsEDL={() => onNavigate('simulators', { sim: 'mars-edl' })}
        onOpenMoonbaseAlpha={() => onNavigate('simulators', { sim: 'moonbase' })}
        onOpenBlackHole={() => onNavigate('simulators', { sim: 'black-hole' })}
        onOpenExpedition={() => onNavigate('simulators', { sim: 'expedition' })}
        onOpenRover={() => onNavigate('simulators', { sim: 'rover' })}
        onOpenCampaign={() => onNavigate('campaign')}
        onOpenComics={() => onNavigate('learning', { tab: 'COMIC' })}
        onOpenLearningHub={(tab) => onNavigate('learning', { tab })}
        onOpenClassroom={() => onNavigate('academy', { tab: 'CLASSROOM' })}
        onOpenDepot={() => onNavigate('academy', { tab: 'DEPOT' })}
        onOpenTeacherGradebook={() => onNavigate('teacher')}
      />
    </div>
  );
};

export default ExploreSpacePage;

