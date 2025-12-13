import TeamCard from './TeamCard'
import { useLanguage } from '../i18n/LanguageContext'

function TeamList({ teams, onDeleteTeam, onUpdateTeamName }) {
  const { t } = useLanguage()
  if (teams.length === 0) return null

  return (
    <div className="teams-list">
      <h3>{t('teamsList')} ({teams.length})</h3>
      <div className="teams-grid">
        {teams.map(team => (
          <TeamCard 
            key={team.id} 
            team={team} 
            onDelete={onDeleteTeam}
            onUpdateName={onUpdateTeamName}
          />
        ))}
      </div>
    </div>
  )
}

export default TeamList

