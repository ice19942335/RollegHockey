import GameCard from './GameCard'
import { useLanguage } from '../i18n/LanguageContext'

function GamesList({ games, teams, onDeleteGame, onDeleteAllGames, isDeletingAllGames = false }) {
  const { t } = useLanguage()
  if (games.length === 0) return null

  return (
    <section className="section">
      <div className="games-list-header">
        <h2>{t('gamesTitle')} ({games.length})</h2>
        <button 
          className={`btn-delete-all ${isDeletingAllGames ? 'btn-loading' : ''}`}
          onClick={onDeleteAllGames}
          disabled={isDeletingAllGames}
        >
          {isDeletingAllGames && <span className="btn-spinner"></span>}
          {t('deleteAllGames')}
        </button>
      </div>
      <div className="games-list">
        {games.map(game => {
          const homeTeam = teams.find(t => String(t.id) === String(game.homeTeamId))
          const awayTeam = teams.find(t => String(t.id) === String(game.awayTeamId))
          
          
          return (
            <GameCard
              key={game.id}
              game={game}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              onDelete={onDeleteGame}
            />
          )
        })}
      </div>
    </section>
  )
}

export default GamesList

