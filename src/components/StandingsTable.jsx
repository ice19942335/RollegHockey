import { useMemo, useState } from 'react'
import { calculateStandings } from '../utils/calculateStats'
import TeamLogo from './TeamLogo'
import { useLanguage } from '../i18n/LanguageContext'

function StandingsTable({ teams, games }) {
  const { t } = useLanguage()
  const [isLegendExpanded, setIsLegendExpanded] = useState(false)
  const [isScoringSystemExpanded, setIsScoringSystemExpanded] = useState(false)
  const standings = useMemo(() => {
    return calculateStandings(teams, games)
  }, [teams, games])

  if (standings.length === 0) return null

  return (
    <section className="section standings-section">
      <h2>{t('standingsTitle')}</h2>
      <div className="standings-table-wrapper">
        <table className="standings-table">
          <thead>
            <tr>
              <th></th>
              <th>{t('teamColumn')}</th>
              <th>{t('pointsColumn')}</th>
              <th>{t('gamesColumn')}</th>
              <th>{t('winsRegularColumn')}</th>
              <th>{t('winsShootoutColumn')}</th>
              <th>{t('lossesRegularColumn')}</th>
              <th>{t('lossesShootoutColumn')}</th>
              <th>{t('drawsColumn')}</th>
              <th>{t('goalsForColumn')}</th>
              <th>{t('goalsAgainstColumn')}</th>
              <th>{t('goalDiffColumn')}</th>
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
                <td className="points">{team.points}</td>
                <td>{team.gamesPlayed}</td>
                <td>{team.wins}</td>
                <td>{team.winsOT}</td>
                <td>{team.losses}</td>
                <td>{team.lossesOT}</td>
                <td>{team.draws || 0}</td>
                <td>{team.goalsFor}</td>
                <td>{team.goalsAgainst}</td>
                <td className={team.goalDifference >= 0 ? 'positive' : 'negative'}>
                  {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend-container">
        <div className="legend-wrapper">
          <div 
            className="section-header-collapsible"
            onClick={() => setIsLegendExpanded(!isLegendExpanded)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <p><strong>{t('legend')}</strong></p>
            <span className={`collapse-icon ${isLegendExpanded ? 'expanded' : 'collapsed'}`}>
              ▼
            </span>
          </div>
          <div className={`section-collapsible-content ${isLegendExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="legend">
              <ul>
                <li>{t('legendPoints')}</li>
                <li>{t('legendGames')}</li>
                <li>{t('legendWinsRegular')}</li>
                <li>{t('legendWinsShootout')}</li>
                <li>{t('legendLossesRegular')}</li>
                <li>{t('legendLossesShootout')}</li>
                <li>{t('legendDraws')}</li>
                <li>{t('legendGoalsFor')}</li>
                <li>{t('legendGoalsAgainst')}</li>
                <li>{t('legendGoalDiff')}</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="scoring-system-wrapper">
          <div 
            className="section-header-collapsible"
            onClick={() => setIsScoringSystemExpanded(!isScoringSystemExpanded)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <p><strong>{t('scoringSystem')}</strong></p>
            <span className={`collapse-icon ${isScoringSystemExpanded ? 'expanded' : 'collapsed'}`}>
              ▼
            </span>
          </div>
          <div className={`section-collapsible-content ${isScoringSystemExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="scoring-system">
              <ul>
                <li>{t('scoringWinRegular')}</li>
                <li>{t('scoringWinShootout')}</li>
                <li>{t('scoringDrawRegular')}</li>
                <li>{t('scoringDrawShootout')}</li>
                <li>{t('scoringLoss')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default StandingsTable

