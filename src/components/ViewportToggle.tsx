import React from 'react';
import { Box, Map as MapIcon } from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

interface ViewportToggleProps {
  is3DView: boolean;
  onSetView: (is3D: boolean) => void;
}

export const ViewportToggle: React.FC<ViewportToggleProps> = ({ is3DView, onSetView }) => (
  <div style={{
    display: 'flex',
    gap: '2px',
    backgroundColor: 'var(--color-paper-3)',
    padding: '2px',
    border: 'var(--rule-hair) solid var(--color-rule)',
  }}>
    <button
      onClick={() => { onSetView(true); soundFx.playClick(750); }}
      className={is3DView ? 'hm-btn-primary' : 'hm-btn-secondary'}
      style={{
        padding: '4px 8px',
        fontSize: '11px',
        fontFamily: 'var(--font-outlier)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <Box size={12} />
      <span>3D Live</span>
    </button>
    <button
      onClick={() => { onSetView(false); soundFx.playClick(650); }}
      className={!is3DView ? 'hm-btn-primary' : 'hm-btn-secondary'}
      style={{
        padding: '4px 8px',
        fontSize: '11px',
        fontFamily: 'var(--font-outlier)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <MapIcon size={12} />
      <span>2D Map</span>
    </button>
  </div>
);
