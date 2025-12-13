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
              <th>ПО</th>
              <th>ПБ</th>
              <th>Пораж.О</th>
              <th>Пораж.Б</th>
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
                <td>{team.losses}</td>
                <td>{team.lossesOT}</td>
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
        <p><strong>Легенда:</strong></p>
        <ul>
          <li>И - Игры</li>
          <li>ПО - Победы в основное время</li>
          <li>ПБ - Победы в буллитах</li>
          <li>Пораж.О - Поражения в основное время</li>
          <li>Пораж.Б - Поражения в буллитах</li>
          <li>ЗГ - Забитые голы</li>
          <li>ПГ - Пропущенные голы</li>
          <li>± - Разница голов</li>
          <li>О - Очки</li>
        </ul>
        <p><strong>Система очков:</strong></p>
        <ul>
          <li>Победа в основное время - 3 очка</li>
          <li>Победа в буллитах - 2 очка</li>
          <li>Ничья в основное время - 1 очко</li>
          <li>Ничья в буллитах - 1 очко</li>
          <li>Поражение - 0 очков</li>
        </ul>
      </div>
    </section>
  )
}

export default StandingsTable

