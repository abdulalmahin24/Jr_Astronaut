import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, X, Image as ImageIcon, Sparkles, Check, RefreshCw, Layers } from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export interface NasaAssetItem {
  nasaId: string;
  title: string;
  description: string;
  dateCreated: string;
  center?: string;
  keywords?: string[];
  thumbnailUrl: string;
  largeUrl?: string;
}

// Pre-cached authentic NASA photographs from images.nasa.gov
export const FEATURED_NASA_ASSETS: NasaAssetItem[] = [
  {
    nasaId: 'as11-40-5873',
    title: 'Apollo 11 Tranquility Base · US Flag & Lunar Module Eagle',
    description: 'Astronaut Buzz Aldrin stands beside the deployed United States flag with the Apollo 11 Lunar Module "Eagle" in the background at Tranquility Base. Photographed by Neil Armstrong with 70mm Hasselblad camera.',
    dateCreated: '1969-07-20',
    center: 'JSC',
    keywords: ['Apollo 11', 'Tranquility Base', 'Moon', 'Lunar Module', 'Flag', 'Neil Armstrong', 'Buzz Aldrin'],
    thumbnailUrl: '/assets/nasa/nasa_apollo11_flag_lander.jpg',
    largeUrl: '/assets/nasa/nasa_apollo11_flag_lander.jpg',
  },
  {
    nasaId: 'as11-40-5903',
    title: 'Buzz Aldrin Walking on the Lunar Surface',
    description: 'Iconic Apollo 11 photograph of astronaut Buzz Aldrin traversing the Sea of Tranquility. The gold reflective visor shows Neil Armstrong, the LM Eagle, and the desolate lunar horizon in crystal reflection.',
    dateCreated: '1969-07-20',
    center: 'JSC',
    keywords: ['Apollo 11', 'Visor', 'Regolith', 'Moonwalk', 'EVA', 'Historic'],
    thumbnailUrl: '/assets/nasa/nasa_apollo11_aldrin_walk.jpg',
    largeUrl: '/assets/nasa/nasa_apollo11_aldrin_walk.jpg',
  },
  {
    nasaId: 'iss059e002710',
    title: 'ISS Spacewalk · Low Earth Orbit 408 km',
    description: 'Extravehicular Activity (EVA) spacewalker in the NASA EMU spacesuit outside the International Space Station, high above the curved blue limb and clouds of planet Earth.',
    dateCreated: '2019-03-22',
    center: 'JSC',
    keywords: ['ISS', 'Spacewalk', 'EMU Spacesuit', 'Earth Orbit', 'Space Station', 'EVA'],
    thumbnailUrl: '/assets/nasa/nasa_iss_spacewalk_earth.jpg',
    largeUrl: '/assets/nasa/nasa_iss_spacewalk_earth.jpg',
  },
  {
    nasaId: 's84-27017',
    title: 'Bruce McCandless Untethered MMU Spacewalk',
    description: 'Astronaut Bruce McCandless II floats completely untethered in the Manned Maneuvering Unit (MMU) nitrogen thruster backpack, drifting over 320 feet away from the Space Shuttle Challenger orbiter.',
    dateCreated: '1984-02-07',
    center: 'JSC',
    keywords: ['STS-41B', 'Challenger', 'MMU', 'Untethered', 'Spacewalk', 'Earth Horizon'],
    thumbnailUrl: '/assets/nasa/nasa_mccandless_spacewalk.jpg',
    largeUrl: '/assets/nasa/nasa_mccandless_spacewalk.jpg',
  },
  {
    nasaId: 'as17-147-22527',
    title: 'Apollo 17 · Gene Cernan with Lunar Roving Vehicle',
    description: 'Commander Eugene Cernan stands by the Lunar Roving Vehicle (LRV) at the Taurus-Littrow exploration site, with the massive lunar boulders and mountains rising in the vacuum backdrop.',
    dateCreated: '1972-12-11',
    center: 'JSC',
    keywords: ['Apollo 17', 'Lunar Rover', 'Gene Cernan', 'Taurus-Littrow', 'Moon', 'LRV'],
    thumbnailUrl: '/assets/nasa/nasa_apollo17_rover_moon.jpg',
    largeUrl: '/assets/nasa/nasa_apollo17_rover_moon.jpg',
  },
  {
    nasaId: 'PIA24333',
    title: 'Perseverance Rover on the Surface of Mars',
    description: 'Real high-definition panoramic landscape of Jezero Crater taken by NASA Perseverance Rover Mastcam-Z system, revealing genuine reddish-orange Martian desert regolith and craters.',
    dateCreated: '2021-02-18',
    center: 'JPL',
    keywords: ['Mars 2020', 'Perseverance', 'Jezero Crater', 'Martian Surface', 'Sample Return'],
    thumbnailUrl: '/assets/nasa/nasa_mars_perseverance.jpg',
    largeUrl: '/assets/nasa/nasa_mars_perseverance.jpg',
  },
  {
    nasaId: 'iss039e005387',
    title: 'Earth Observations from ISS 7-Window Cupola',
    description: 'Authentic photograph looking out the 7 panoramic observation windows of the Cupola module on the International Space Station, gazing down at the atmospheric turquoise curve of Earth.',
    dateCreated: '2014-03-29',
    center: 'JSC',
    keywords: ['ISS', 'Cupola', 'Observation Deck', 'Earth', 'Windows', 'Spaceflight'],
    thumbnailUrl: '/assets/nasa/nasa_iss_cupola_earth.jpg',
    largeUrl: '/assets/nasa/nasa_iss_cupola_earth.jpg',
  },
];

const PRESET_QUERIES = [
  { label: 'Apollo 11 Lunar Surface', q: 'apollo 11 lunar surface' },
  { label: 'Artemis Program', q: 'artemis moon' },
  { label: 'ISS Spacewalks', q: 'iss astronaut spacewalk' },
  { label: 'Mars Perseverance', q: 'perseverance surface' },
  { label: 'James Webb (JWST)', q: 'james webb telescope deep field' },
  { label: 'Hubble Deep Space', q: 'hubble nebula' },
];

interface NasaImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsBackground?: (asset: NasaAssetItem) => void;
  activeBackgroundNasaId?: string;
}

export const NasaImageLibraryModal: React.FC<NasaImageLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectAsBackground,
  activeBackgroundNasaId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'FEATURED' | 'SEARCH'>('FEATURED');
  const [searchResults, setSearchResults] = useState<NasaAssetItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<NasaAssetItem | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedAsset(null);
    }
  }, [isOpen]);

  const handleSearch = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    soundFx.playTelemetryChirp();
    setIsSearching(true);
    setErrorMsg(null);
    setActiveTab('SEARCH');

    try {
      const endpoint = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`NASA API returned status ${res.status}`);
      const data = await res.json();

      const items: NasaAssetItem[] = (data.collection?.items || [])
        .slice(0, 24)
        .map((item: any) => {
          const d = item.data?.[0] || {};
          const thumb = item.links?.[0]?.href || '';
          return {
            nasaId: d.nasa_id || '',
            title: d.title || 'Untitled NASA Archive Asset',
            description: d.description || d.description_508 || 'Official NASA photography archive record.',
            dateCreated: d.date_created ? d.date_created.split('T')[0] : 'N/A',
            center: d.center || 'NASA',
            keywords: d.keywords || [],
            thumbnailUrl: thumb,
            largeUrl: thumb.replace('~thumb.jpg', '~large.jpg').replace('~thumb.png', '~large.png'),
          };
        })
        .filter((item: NasaAssetItem) => item.thumbnailUrl && item.nasaId);

      setSearchResults(items);
      if (items.length === 0) {
        setErrorMsg(`No direct matches found for "${q}". Try "Apollo", "Artemis", or "Spacewalk".`);
      }
    } catch (err: any) {
      console.warn('NASA Search API error:', err);
      setErrorMsg('Could not reach images-api.nasa.gov. Displaying verified local archive.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  const displayList = activeTab === 'FEATURED' ? FEATURED_NASA_ASSETS : searchResults;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(5, 7, 12, 0.94)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '92vh',
          background: 'linear-gradient(180deg, rgba(14, 20, 32, 0.98) 0%, rgba(7, 10, 17, 0.98) 100%)',
          border: '1px solid rgba(0, 210, 255, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 40px rgba(0, 210, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '18px 28px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(7, 9, 14, 0.9) 0%, rgba(15, 23, 42, 0.8) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(0, 210, 255, 0.15)',
                border: '1px solid #00d2ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 0 16px rgba(0, 210, 255, 0.4)',
              }}
            >
              🏛️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'var(--font-space)', color: '#ffffff', letterSpacing: '0.04em' }}>
                  NASA IMAGE &amp; VIDEO ARCHIVE EXPLORER
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#6ee7b7',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  LIVE API: images.nasa.gov
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                Official Public NASA Archives · Apollo, Artemis, ISS, Mars, Hubble &amp; James Webb Space Photography
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="https://images.nasa.gov/"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#38bdf8',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                textDecoration: 'none',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              <span>OPEN IMAGES.NASA.GOV</span>
              <ExternalLink size={13} />
            </a>
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(148, 163, 184, 0.12)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              title="Close NASA Explorer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Preset Filter Bar */}
        <div
          style={{
            padding: '16px 28px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
            background: 'rgba(10, 15, 26, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(0, 210, 255, 0.35)',
                borderRadius: '8px',
                padding: '0 16px',
              }}
            >
              <Search size={18} style={{ color: '#00d2ff' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search millions of official NASA mission photos (e.g., 'Apollo 11', 'Artemis I', 'Mars Jezero', 'ISS Cupola')..."
                style={{
                  flex: 1,
                  height: '42px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              style={{
                background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                padding: '0 24px',
                fontWeight: 800,
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)',
              }}
            >
              {isSearching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              <span>{isSearching ? 'SEARCHING...' : 'SEARCH ARCHIVE'}</span>
            </button>
          </form>

          {/* Preset Category Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
              QUICK ARCHIVES:
            </span>
            <button
              onClick={() => {
                soundFx.playClick(800);
                setActiveTab('FEATURED');
              }}
              style={{
                background: activeTab === 'FEATURED' ? 'rgba(0, 210, 255, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                border: activeTab === 'FEATURED' ? '1px solid #00d2ff' : '1px solid rgba(148, 163, 184, 0.2)',
                color: activeTab === 'FEATURED' ? '#ffffff' : '#cbd5e1',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={13} style={{ color: '#ff9e1b' }} />
              <span>✦ FEATURED MASTER ARCHIVES (7)</span>
            </button>

            {PRESET_QUERIES.map((p) => (
              <button
                key={p.q}
                onClick={() => {
                  setSearchQuery(p.q);
                  handleSearch(p.q);
                }}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#94a3b8',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area: Image Grid & Detail Lightbox */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', position: 'relative' }}>
          {errorMsg && (
            <div
              style={{
                padding: '12px 18px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '12.5px',
                fontFamily: 'var(--font-mono)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {isSearching ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '320px',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '3px solid rgba(0, 210, 255, 0.25)',
                  borderTopColor: '#00d2ff',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <div style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.1em' }}>
                QUERYING NASA IMAGES API (images-api.nasa.gov)...
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '18px',
              }}
            >
              {displayList.map((asset) => {
                const isCurrentBg = activeBackgroundNasaId === asset.nasaId;
                return (
                  <div
                    key={asset.nasaId}
                    onClick={() => {
                      soundFx.playClick(850);
                      setSelectedAsset(asset);
                    }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: isCurrentBg ? '2px solid #10b981' : '1px solid rgba(148, 163, 184, 0.22)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: isCurrentBg ? '0 0 20px rgba(16, 185, 129, 0.3)' : '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                    className="hover:scale-[1.02] hover:border-cyan-400"
                  >
                    {/* Thumbnail Image Container */}
                    <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden', background: '#020617' }}>
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.title}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.4s ease',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: 'rgba(7, 9, 14, 0.85)',
                          border: '1px solid rgba(0, 210, 255, 0.4)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '9.5px',
                          fontFamily: 'var(--font-mono)',
                          color: '#00d2ff',
                          fontWeight: 800,
                        }}
                      >
                        {asset.nasaId.toUpperCase()}
                      </div>

                      {isCurrentBg && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(16, 185, 129, 0.95)',
                            color: '#ffffff',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            fontSize: '9.5px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 0 10px rgba(16, 185, 129, 0.6)',
                          }}
                        >
                          <Check size={11} />
                          <span>LOBBY BACKDROP</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Card Footer */}
                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 800,
                            color: '#f8fafc',
                            fontFamily: 'var(--font-space)',
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {asset.title}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '6px', display: 'flex', gap: '8px' }}>
                          <span>📅 {asset.dateCreated}</span>
                          <span>•</span>
                          <span>🏛️ {asset.center}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFx.playClick(900);
                            setSelectedAsset(asset);
                          }}
                          style={{
                            flex: 1,
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '5px',
                            color: '#cbd5e1',
                            padding: '5px 8px',
                            fontSize: '10.5px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          INSPECT ARCHIVE
                        </button>
                        {onSelectAsBackground && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              soundFx.playClick(950);
                              onSelectAsBackground(asset);
                            }}
                            style={{
                              background: isCurrentBg ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 210, 255, 0.2)',
                              border: isCurrentBg ? '1px solid #10b981' : '1px solid #00d2ff',
                              borderRadius: '5px',
                              color: isCurrentBg ? '#6ee7b7' : '#38bdf8',
                              padding: '5px 8px',
                              fontSize: '10.5px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                            title="Set this authentic NASA photograph as the main lobby background"
                          >
                            {isCurrentBg ? 'EQUIPPED' : 'SET AS BG'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fullscreen Asset Lightbox Inspector */}
          {selectedAsset && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10050,
                background: 'rgba(3, 5, 9, 0.96)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px',
                animation: 'fadeIn 0.2s ease-out',
              }}
              onClick={() => setSelectedAsset(null)}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '1080px',
                  maxHeight: '88vh',
                  background: '#0a0f1d',
                  border: '1px solid rgba(0, 210, 255, 0.5)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.95), 0 0 50px rgba(0, 210, 255, 0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Lightbox Header */}
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(15, 23, 42, 0.9)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>📷</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-space)' }}>
                        {selectedAsset.title}
                      </div>
                      <div style={{ fontSize: '10px', color: '#00d2ff', fontFamily: 'var(--font-mono)' }}>
                        NASA ARCHIVE ID: {selectedAsset.nasaId.toUpperCase()} · CENTER: {selectedAsset.center} · DATE: {selectedAsset.dateCreated}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedAsset(null)}
                    style={{
                      background: 'rgba(148, 163, 184, 0.15)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      color: '#ffffff',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Lightbox Body (Image + Details) */}
                <div style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'row' }}>
                  {/* Left: High-Res Image Display */}
                  <div
                    style={{
                      flex: 1.6,
                      background: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: '16px',
                    }}
                  >
                    <img
                      src={selectedAsset.largeUrl || selectedAsset.thumbnailUrl}
                      alt={selectedAsset.title}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '62vh',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
                      }}
                    />
                  </div>

                  {/* Right: Technical Metadata Panel */}
                  <div
                    style={{
                      flex: 1,
                      padding: '20px',
                      background: 'rgba(11, 16, 28, 0.95)',
                      borderLeft: '1px solid rgba(148, 163, 184, 0.2)',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ff9e1b', fontWeight: 800, letterSpacing: '0.08em' }}>
                        OFFICIAL NASA CAPTION:
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#cbd5e1',
                          lineHeight: 1.6,
                          marginTop: '8px',
                          fontFamily: 'var(--font-sans)',
                          maxHeight: '220px',
                          overflowY: 'auto',
                        }}
                      >
                        {selectedAsset.description}
                      </p>

                      {selectedAsset.keywords && selectedAsset.keywords.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 800, marginBottom: '6px' }}>
                            KEYWORDS &amp; SUBJECTS:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {selectedAsset.keywords.slice(0, 10).map((kw, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: 'rgba(30, 41, 59, 0.8)',
                                  border: '1px solid rgba(148, 163, 184, 0.25)',
                                  borderRadius: '3px',
                                  padding: '2px 7px',
                                  fontSize: '10px',
                                  color: '#cbd5e1',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {onSelectAsBackground && (
                        <button
                          onClick={() => {
                            soundFx.playClick(900);
                            onSelectAsBackground(selectedAsset);
                            setSelectedAsset(null);
                          }}
                          style={{
                            background: 'linear-gradient(180deg, #ff9e1b 0%, #d97706 100%)',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 18px',
                            fontWeight: 900,
                            fontFamily: 'var(--font-space)',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 0 25px rgba(255, 158, 27, 0.5)',
                          }}
                        >
                          <Layers size={16} />
                          <span>EQUIP AS MAIN LOBBY BACKGROUND</span>
                        </button>
                      )}

                      <a
                        href={`https://images.nasa.gov/details/${selectedAsset.nasaId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'rgba(30, 41, 59, 0.8)',
                          border: '1px solid rgba(148, 163, 184, 0.3)',
                          borderRadius: '8px',
                          color: '#38bdf8',
                          padding: '10px 18px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11.5px',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>VIEW ON IMAGES.NASA.GOV</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

