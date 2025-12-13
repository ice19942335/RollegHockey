import TeamLogo from './TeamLogo'

const GAME_TYPE_LABELS = {
  regular: 'Основное время',
  overtime: 'Овертайм',
  shootout: 'Буллиты'
}

function GameCard({ game, homeTeam, awayTeam, onDelete }) {
  if (!homeTeam || !awayTeam) return null

  const homeTeamColor = homeTeam?.color || '#FFA000'
  const awayTeamColor = awayTeam?.color || '#FFA000'

  return (
    <div className="game-card">
      <button 
        className="delete-btn-small"
        onClick={() => onDelete(game.id)}
      >
        ✕
      </button>
      <div className="game-teams-display">
        <div className="game-team">
          <span className="game-logo">
            <TeamLogo logo={homeTeam.logo} name={homeTeam.name} />
          </span>
          <span style={{ color: homeTeamColor }}>{homeTeam.name}</span>
        </div>
        <div className="game-score-display game-score-display-desktop">
          <span className="game-logo-inline">
            <TeamLogo logo={homeTeam.logo} name={homeTeam.name} />
          </span>
          <span className="score" style={{ color: homeTeamColor }}>{game.homeScore}</span>
          <span className="score-separator">:</span>
          <span className="score" style={{ color: awayTeamColor }}>{game.awayScore}</span>
          <span className="game-logo-inline">
            <TeamLogo logo={awayTeam.logo} name={awayTeam.name} />
          </span>
        </div>
        <div className="game-team game-team-away">
          <span className="game-logo">
            <TeamLogo logo={awayTeam.logo} name={awayTeam.name} />
          </span>
          <span style={{ color: awayTeamColor }}>{awayTeam.name}</span>
        </div>
      </div>
      <div className="game-info">
        <span className="game-type-badge">{GAME_TYPE_LABELS[game.gameType]}</span>
        <span className="game-date">{game.date}</span>
      </div>
    </div>
  )
}

export default GameCard

