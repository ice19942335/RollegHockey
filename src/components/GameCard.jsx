import TeamLogo from './TeamLogo'

const GAME_TYPE_LABELS = {
  regular: 'Основное время',
  overtime: 'Овертайм',
  shootout: 'Буллиты'
}

function GameCard({ game, homeTeam, awayTeam, onDelete }) {
  if (!homeTeam || !awayTeam) return null

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
          <span>{homeTeam.name}</span>
        </div>
        <div className="game-score-display">
          <span className="score">{game.homeScore}</span>
          <span className="score-separator">:</span>
          <span className="score">{game.awayScore}</span>
        </div>
        <div className="game-team game-team-away">
          <span className="game-logo">
            <TeamLogo logo={awayTeam.logo} name={awayTeam.name} />
          </span>
          <span>{awayTeam.name}</span>
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

