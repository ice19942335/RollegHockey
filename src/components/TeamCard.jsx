import { useState, useRef, useEffect } from 'react'
import TeamLogo from './TeamLogo'

function TeamCard({ team, onDelete, onUpdateName }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(team.name)
  const inputRef = useRef(null)
  const teamColor = team.color || '#1e3c72'

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditedName(team.name)
  }, [team.name])

  const handleNameClick = () => {
    setIsEditing(true)
  }

  const handleNameBlur = () => {
    if (editedName.trim() && editedName.trim() !== team.name) {
      onUpdateName(team.id, editedName.trim())
    } else {
      setEditedName(team.name)
    }
    setIsEditing(false)
  }

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setEditedName(team.name)
      setIsEditing(false)
    }
  }
  
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
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="team-name-input"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyPress}
        />
      ) : (
        <div 
          className="team-name"
          onClick={handleNameClick}
          title="Кликните для редактирования"
        >
          {team.name}
        </div>
      )}
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

