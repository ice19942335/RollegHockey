import TeamCard from './TeamCard'
import { useLanguage } from '../i18n/LanguageContext'

function TeamList({ teams, onDeleteTeam, onUpdateTeamName, onDeleteAllTeams }) {
  const { t } = useLanguage()
  if (teams.length === 0) return null

  return (
    <div className="teams-list">
      <div className="teams-list-header">
        <h3>{t('teamsList')} ({teams.length})</h3>
        {teams.length > 0 && (
          <button
            className="btn-delete-all-teams"
            onClick={onDeleteAllTeams}
            title={t('deleteAllTeams')}
          >
            {t('deleteAllTeams')}
          </button>
        )}
      </div>
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

