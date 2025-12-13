import { useMemo } from 'react'
import { calculateStandings } from '../utils/calculateStats'
import TeamLogo from './TeamLogo'

function StandingsTable({ teams, games }) {
  const standings = useMemo(() => {
    return calculateStandings(teams, games)
  }, [teams, games])

  if (standings.length === 0) return null

  return (
    <section className="section standings-section">
      <h2>Турнирная таблица</h2>
      <div className="standings-table-wrapper">
        <table className="standings-table">
          <thead>
            <tr>
              <th>Место</th>
              <th>Команда</th>
              <th>И</th>
              <th>В</th>
              <th>ВО</th>
              <th>ПО</th>
              <th>П</th>
              <th>ЗГ</th>
              <th>ПГ</th>
              <th>±</th>
              <th>О</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={team.id}>
                <td className="position">{index + 1}</td>
                <td className="team-cell">
                  <span 
                    className="team-color-bar"
                    style={{ backgroundColor: team.color || '#1e3c72' }}
                  />
                  <span className="team-logo-small">
                    <TeamLogo logo={team.logo} name={team.name} size="small" />
                  </span>
                  {team.name}
                </td>
                <td>{team.gamesPlayed}</td>
                <td>{team.wins}</td>
                <td>{team.winsOT}</td>
                <td>{team.lossesOT}</td>
                <td>{team.losses}</td>
                <td>{team.goalsFor}</td>
                <td>{team.goalsAgainst}</td>
                <td className={team.goalDifference >= 0 ? 'positive' : 'negative'}>
                  {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                </td>
                <td className="points">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend">
        <p><strong>Легенда:</strong> И - Игры, В - Победы в основное время, ВО - Победы в овертайме/буллитах, 
        ПО - Поражения в овертайме/буллитах, П - Поражения, ЗГ - Забитые голы, ПГ - Пропущенные голы, 
        ± - Разница голов, О - Очки</p>
        <p><strong>Система очков:</strong> Победа в основное время - 3 очка, Победа в овертайме/буллитах - 2 очка, 
        Поражение в овертайме/буллитах - 1 очко, Поражение в основное время - 0 очков</p>
      </div>
    </section>
  )
}

export default StandingsTable

