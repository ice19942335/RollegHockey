import GameCard from './GameCard'

function GamesList({ games, teams, onDeleteGame, onDeleteAllGames }) {
  if (games.length === 0) return null

  return (
    <section className="section">
      <div className="games-list-header">
        <h2>Игры ({games.length})</h2>
        <button 
          className="btn-delete-all"
          onClick={onDeleteAllGames}
        >
          🗑️ Удалить все игры
        </button>
      </div>
      <div className="games-list">
        {games.map(game => {
          const homeTeam = teams.find(t => String(t.id) === String(game.homeTeamId))
          const awayTeam = teams.find(t => String(t.id) === String(game.awayTeamId))
          
          // Логируем для отладки, если команды не найдены
          if (!homeTeam || !awayTeam) {
            console.warn('Команды не найдены для игры:', {
              gameId: game.id,
              homeTeamId: game.homeTeamId,
              awayTeamId: game.awayTeamId,
              homeTeamFound: !!homeTeam,
              awayTeamFound: !!awayTeam,
              availableTeamIds: teams.map(t => ({ id: t.id, name: t.name }))
            })
          }
          
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

