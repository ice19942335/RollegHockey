import TeamCard from './TeamCard'

function TeamList({ teams, onDeleteTeam, onUpdateTeamName }) {
  if (teams.length === 0) return null

  return (
    <div className="teams-list">
      <h3>Команды ({teams.length})</h3>
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

