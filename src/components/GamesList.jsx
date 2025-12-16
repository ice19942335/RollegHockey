import GameCard from './GameCard'
import { useLanguage } from '../i18n/LanguageContext'

function GamesList({ games, teams, onDeleteGame, onDeleteAllGames, isDeletingAllGames = false }) {
  const { t } = useLanguage()
  if (games.length === 0) return null

  const gamesByRound = new Map()
  const gamesWithoutRound = []

  for (const game of games) {
    const round =
      game?.round === null || game?.round === undefined || game?.round === ''
        ? null
        : parseInt(game.round, 10) || null

    if (!round) {
      gamesWithoutRound.push(game)
      continue
    }

    if (!gamesByRound.has(round)) {
      gamesByRound.set(round, [])
    }
    gamesByRound.get(round).push(game)
  }

  const sortedRounds = Array.from(gamesByRound.keys()).sort((a, b) => a - b)

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
        {sortedRounds.map(round => (
          <div key={`round-${round}`} className="games-round-group">
            <div className="games-round-header">
              <h3 className="games-round-title">{t('roundGroupTitle', { round })}</h3>
            </div>
            <div className="games-round-list">
              {gamesByRound.get(round).map(game => {
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
          </div>
        ))}

        {gamesWithoutRound.length > 0 && (
          <div className="games-round-group games-round-group-no-round">
            <div className="games-round-header">
              <h3 className="games-round-title">{t('noRoundGroupTitle')}</h3>
            </div>
            <div className="games-round-list">
              {gamesWithoutRound.map(game => {
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
          </div>
        )}
      </div>
    </section>
  )
}

export default GamesList

