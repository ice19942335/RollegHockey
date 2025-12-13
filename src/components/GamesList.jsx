import GameCard from './GameCard'

function GamesList({ games, teams, onDeleteGame }) {
  if (games.length === 0) return null

  return (
    <section className="section">
      <h2>Игры ({games.length})</h2>
      <div className="games-list">
        {games.map(game => {
          const homeTeam = teams.find(t => t.id === game.homeTeamId)
          const awayTeam = teams.find(t => t.id === game.awayTeamId)
          
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

