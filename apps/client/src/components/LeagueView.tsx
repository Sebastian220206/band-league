import React, { useState } from 'react';
import { VENUES, VenueInfo } from '@band-league/shared';
import { Trophy, Swords, ArrowLeft } from 'lucide-react';

interface LeagueViewProps {
  onClose: () => void;
  onStartVenueConcert: (venue: VenueInfo) => void;
  onStartBattle: () => void;
}

export const LeagueView: React.FC<LeagueViewProps> = ({
  onClose,
  onStartVenueConcert,
  onStartBattle,
}) => {
  const [activeTab, setActiveTab] = useState<'tour' | 'leaderboard'>('tour');
  const userFans = 1450;
  const userRating = 1240;

  const mockLeaderboard = [
    { rank: 1, name: 'The Voltage Kings', division: 'headliner', rating: 2840, fans: 94000, streak: 9 },
    { rank: 2, name: 'Cyber Syndicate', division: 'festival', rating: 2410, fans: 62000, streak: 5 },
    { rank: 3, name: 'Tokyo Midnight', division: 'arena', rating: 1980, fans: 28000, streak: 3 },
    { rank: 4, name: 'Velvet Groove', division: 'club', rating: 1450, fans: 8500, streak: 2 },
    { rank: 5, name: 'The Neon Rebels (YOU)', division: 'garage', rating: 1240, fans: 1450, streak: 3 },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#090a10',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        color: '#f8fafc',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: '#12141c',
          borderBottom: '1px solid #242938',
        }}
      >
        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94a3b8',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: '#191c28',
          }}
        >
          <ArrowLeft size={16} /> Back to Lobby
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trophy size={20} color="#f59e0b" />
          <h2 style={{ fontSize: '20px', fontWeight: 900 }}>Band League & World Tour</h2>
        </div>

        <button
          onClick={onStartBattle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '13px',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
          }}
        >
          <Swords size={18} /> BATTLE OF THE BANDS
        </button>
      </div>

      {/* Profile Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '14px 24px',
          backgroundColor: '#0d0f16',
          borderBottom: '1px solid #1f2433',
          fontSize: '13px',
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>Your Band: </span>
          <span style={{ fontWeight: 800, color: '#f8fafc' }}>The Neon Rebels</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Division: </span>
          <span style={{ fontWeight: 800, color: '#10b981' }}>Garage Circuit</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>ELO Rating: </span>
          <span style={{ fontWeight: 800, color: '#f59e0b', fontFamily: 'JetBrains Mono' }}>
            {userRating}
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>Fan Base: </span>
          <span style={{ fontWeight: 800, color: '#ec4899', fontFamily: 'JetBrains Mono' }}>
            {userFans.toLocaleString()} Fans
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', padding: '12px 24px', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('tour')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'tour' ? '#f97316' : '#161925',
            color: activeTab === 'tour' ? '#08090d' : '#94a3b8',
            fontWeight: 800,
            fontSize: '13px',
          }}
        >
          Venues & Tour Campaign
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'leaderboard' ? '#f97316' : '#161925',
            color: activeTab === 'leaderboard' ? '#08090d' : '#94a3b8',
            fontWeight: 800,
            fontSize: '13px',
          }}
        >
          Seasonal League Standings
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        {activeTab === 'tour' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginTop: '8px',
            }}
          >
            {VENUES.map((venue, idx) => {
              const isUnlocked = userFans >= venue.requiredFans;
              return (
                <div
                  key={venue.id}
                  style={{
                    backgroundColor: '#12141c',
                    borderRadius: '16px',
                    border: isUnlocked ? `2px solid ${venue.stageGlowColor}66` : '1px solid #1f2433',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    opacity: isUnlocked ? 1 : 0.6,
                    boxShadow: isUnlocked ? `0 0 25px ${venue.stageGlowColor}22` : 'none',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: venue.stageGlowColor }}>
                        STAGE {idx + 1} • {venue.city.toUpperCase()}
                      </span>
                      {isUnlocked ? (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>UNLOCKED</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Needs {venue.requiredFans} fans
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '20px', fontWeight: 900, marginTop: '6px' }}>{venue.name}</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.4 }}>
                      {venue.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                      Crowd Size: <span style={{ color: '#f8fafc', fontWeight: 700 }}>{venue.crowdSize}</span>
                    </div>

                    <button
                      onClick={() => onStartVenueConcert(venue)}
                      disabled={!isUnlocked}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: isUnlocked ? venue.stageGlowColor : '#1e2230',
                        color: isUnlocked ? '#08090d' : '#64748b',
                        fontWeight: 900,
                        fontSize: '13px',
                      }}
                    >
                      {isUnlocked ? 'PERFORM AT THIS VENUE' : 'LOCKED'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Seasonal Leaderboard Table */
          <div
            style={{
              backgroundColor: '#12141c',
              borderRadius: '16px',
              border: '1px solid #242938',
              overflow: 'hidden',
              marginTop: '8px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 1.5fr 1fr 1fr 1fr',
                padding: '14px 20px',
                backgroundColor: '#161925',
                fontSize: '12px',
                fontWeight: 800,
                color: '#64748b',
              }}
            >
              <span>RANK</span>
              <span>BAND</span>
              <span>DIVISION</span>
              <span>ELO RATING</span>
              <span>STREAK</span>
            </div>

            {mockLeaderboard.map((entry) => (
              <div
                key={entry.rank}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1.5fr 1fr 1fr 1fr',
                  padding: '16px 20px',
                  borderTop: '1px solid #1f2433',
                  alignItems: 'center',
                  fontSize: '14px',
                  backgroundColor: entry.name.includes('(YOU)') ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
                }}
              >
                <span
                  style={{
                    fontWeight: 900,
                    color: entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#94a3b8' : '#f8fafc',
                  }}
                >
                  #{entry.rank}
                </span>
                <span style={{ fontWeight: 800, color: entry.name.includes('(YOU)') ? '#f97316' : '#f8fafc' }}>
                  {entry.name}
                </span>
                <span style={{ textTransform: 'capitalize', color: '#10b981', fontWeight: 600 }}>
                  {entry.division}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{entry.rating}</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>🔥 {entry.streak} Wins</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
