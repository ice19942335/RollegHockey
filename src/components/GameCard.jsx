import TeamLogo from './TeamLogo'
import { useLanguage } from '../i18n/LanguageContext'

function GameCard({ game, homeTeam, awayTeam, onDelete }) {
  const { t } = useLanguage()
  
  const GAME_TYPE_LABELS = {
    regular: t('gameTypeRegular'),
    overtime: 'Овертайм', // Не используется, но оставлено для совместимости
    shootout: t('gameTypeShootout')
  }
  if (!homeTeam || !awayTeam) return null

  const homeTeamColor = homeTeam?.color || '#FFA000'
  const awayTeamColor = awayTeam?.color || '#FFA000'
  const round =
    game?.round === null || game?.round === undefined || game?.round === ''
      ? null
      : parseInt(game.round, 10) || null

  return (
    <div className="game-card">
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
        {round && <span className="game-round-badge">{t('roundGroupTitle', { round })}</span>}
        <span className="game-date">{game.date}</span>
        <button 
          className="btn-delete-game-card"
          onClick={() => onDelete(game.id)}
          title={t('deletePendingGame')}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

export default GameCard

