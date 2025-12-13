import GameCard from './GameCard'
import { useLanguage } from '../i18n/LanguageContext'

function GamesList({ games, teams, onDeleteGame, onDeleteAllGames }) {
  const { t } = useLanguage()
  if (games.length === 0) return null

  return (
    <section className="section">
      <div className="games-list-header">
        <h2>{t('gamesTitle')} ({games.length})</h2>
        <button 
          className="btn-delete-all"
          onClick={onDeleteAllGames}
        >
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

