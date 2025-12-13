import TeamLogo from './TeamLogo'

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
  const gameTypeLabels = {
    regular: 'Основное время',
    overtime: 'Овертайм',
    shootout: 'Буллиты'
  }

  const homeTeamColor = homeTeam?.color || '#1e3c72'
  const awayTeamColor = awayTeam?.color || '#1e3c72'

  const currentHomeScore = parseInt(homeScore) || 0
  const currentAwayScore = parseInt(awayScore) || 0

  return (
    <div className="scoreboard-overlay" onClick={onClose}>
      <div className="scoreboard" onClick={(e) => e.stopPropagation()}>
        <button className="scoreboard-close" onClick={onClose}>
          ✕
        </button>
        
        <div className="scoreboard-content">
          <div 
            className="scoreboard-team scoreboard-team-home"
            style={{ 
              background: `linear-gradient(135deg, ${homeTeamColor} 0%, ${homeTeamColor}dd 100%)`,
              borderColor: homeTeamColor
            }}
          >
            <div className="scoreboard-team-logo">
              {homeTeam && (
                <TeamLogo logo={homeTeam.logo} name={homeTeam.name} />
              )}
            </div>
            <div className="scoreboard-team-name">{homeTeam?.name || 'Команда 1'}</div>
            <div className="scoreboard-score-controls">
              <button
                type="button"
                className="scoreboard-btn scoreboard-btn-minus"
                onClick={(e) => {
                  e.stopPropagation()
                  onDecrementHomeScore()
                }}
                disabled={currentHomeScore === 0}
              >
                −
              </button>
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
            <div className="scoreboard-game-type">{gameTypeLabels[gameType] || 'Основное время'}</div>
          </div>

          <div 
            className="scoreboard-team scoreboard-team-away"
            style={{ 
              background: `linear-gradient(135deg, ${awayTeamColor} 0%, ${awayTeamColor}dd 100%)`,
              borderColor: awayTeamColor
            }}
          >
            <div className="scoreboard-team-logo">
              {awayTeam && (
                <TeamLogo logo={awayTeam.logo} name={awayTeam.name} />
              )}
            </div>
            <div className="scoreboard-team-name">{awayTeam?.name || 'Команда 2'}</div>
            <div className="scoreboard-score-controls">
              <button
                type="button"
                className="scoreboard-btn scoreboard-btn-minus"
                onClick={(e) => {
                  e.stopPropagation()
                  onDecrementAwayScore()
                }}
                disabled={currentAwayScore === 0}
              >
                −
              </button>
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

