import TeamLogo from './TeamLogo'
import { useLanguage } from '../i18n/LanguageContext'

function Scoreboard({ 
  homeTeam, 
  awayTeam, 
  homeScore, 
  awayScore, 
  gameType, 
  onClose,
  onIncrementHomeScore,
  onDecrementHomeScore,
  onIncrementAwayScore,
  onDecrementAwayScore
}) {
  const { t } = useLanguage()
  
  const gameTypeLabels = {
    regular: t('gameTypeRegular'),
    shootout: t('gameTypeShootout')
  }

  const homeTeamColor = homeTeam?.color || '#1e3c72'
  const awayTeamColor = awayTeam?.color || '#1e3c72'

  const currentHomeScore = parseInt(homeScore) || 0
  const currentAwayScore = parseInt(awayScore) || 0

  return (
    <div 
      className="scoreboard-overlay" 
      onClick={onClose}
      style={{
        '--home-team-color': homeTeamColor,
        '--away-team-color': awayTeamColor
      }}
    >
      <div className="scoreboard" onClick={(e) => e.stopPropagation()}>
        <div className="scoreboard-top-bar">
          <div className="scoreboard-game-type">{gameTypeLabels[gameType] || t('gameTypeRegular')}</div>
          <button className="scoreboard-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="scoreboard-content">
          <div 
            className="scoreboard-team scoreboard-team-home"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: homeTeamColor
            }}
          >
            <div className="scoreboard-team-logo">
              {homeTeam && (
                <TeamLogo logo={homeTeam.logo} name={homeTeam.name} />
              )}
            </div>
            <div className="scoreboard-team-name">{homeTeam?.name || t('team1')}</div>
            <div className="scoreboard-score-controls">
              {currentHomeScore > 0 ? (
                <button
                  type="button"
                  className="scoreboard-btn scoreboard-btn-minus"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDecrementHomeScore()
                  }}
                >
                  −
                </button>
              ) : (
                <div className="scoreboard-btn-placeholder"></div>
              )}
              <div className="scoreboard-team-score">{homeScore || 0}</div>
              <button
                type="button"
                className="scoreboard-btn scoreboard-btn-plus"
                onClick={(e) => {
                  e.stopPropagation()
                  onIncrementHomeScore()
                }}
              >
                +
              </button>
            </div>
          </div>

          <div className="scoreboard-separator">
            <div className="scoreboard-vs">VS</div>
          </div>

          <div 
            className="scoreboard-team scoreboard-team-away"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: awayTeamColor
            }}
          >
            <div className="scoreboard-team-logo">
              {awayTeam && (
                <TeamLogo logo={awayTeam.logo} name={awayTeam.name} />
              )}
            </div>
            <div className="scoreboard-team-name">{awayTeam?.name || t('team2')}</div>
            <div className="scoreboard-score-controls">
              {currentAwayScore > 0 ? (
                <button
                  type="button"
                  className="scoreboard-btn scoreboard-btn-minus"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDecrementAwayScore()
                  }}
                >
                  −
                </button>
              ) : (
                <div className="scoreboard-btn-placeholder"></div>
              )}
              <div className="scoreboard-team-score">{awayScore || 0}</div>
              <button
                type="button"
                className="scoreboard-btn scoreboard-btn-plus"
                onClick={(e) => {
                  e.stopPropagation()
                  onIncrementAwayScore()
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Scoreboard

