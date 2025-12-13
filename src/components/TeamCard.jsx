import TeamLogo from './TeamLogo'

function TeamCard({ team, onDelete }) {
  const teamColor = team.color || '#1e3c72'
  
  return (
    <div 
      className="team-card"
      style={{
        borderColor: teamColor,
        boxShadow: `0 4px 15px ${teamColor}40`
      }}
    >
      <div 
        className="team-logo"
        style={{
          background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}dd 100%)`
        }}
      >
        <TeamLogo logo={team.logo} name={team.name} />
      </div>
      <div className="team-name">{team.name}</div>
      <div 
        className="team-color-indicator"
        style={{ backgroundColor: teamColor }}
      />
      <button 
        className="delete-btn-small"
        onClick={() => onDelete(team.id)}
      >
        ✕
      </button>
    </div>
  )
}

export default TeamCard

