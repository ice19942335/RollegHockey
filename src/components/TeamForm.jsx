import { DEFAULT_TEAM_LOGOS, TEAM_COLORS } from '../constants/teamDefaults'

function TeamForm({ 
  newTeamName, 
  setNewTeamName, 
  newTeamLogo, 
  setNewTeamLogo,
  newTeamColor,
  setNewTeamColor,
  onAddTeam 
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onAddTeam()
  }

  const handleLogoSelect = (emoji) => {
    setNewTeamLogo(emoji)
  }

  const handleColorSelect = (color) => {
    setNewTeamColor(color)
  }

  return (
    <form className="team-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={newTeamName}
        onChange={(e) => setNewTeamName(e.target.value)}
        placeholder="Название команды"
        required
      />
      
      <div className="logo-selection">
        <label>Выберите логотип:</label>
        <div className="logo-options">
          {DEFAULT_TEAM_LOGOS.map(logo => (
            <button
              key={logo.id}
              type="button"
              className={`logo-option ${newTeamLogo === logo.emoji ? 'selected' : ''}`}
              onClick={() => handleLogoSelect(logo.emoji)}
              title={logo.name}
            >
              {logo.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="color-selection">
        <label>Выберите цвет команды:</label>
        <div className="color-options">
          {TEAM_COLORS.map(color => (
            <button
              key={color.id}
              type="button"
              className={`color-option ${newTeamColor === color.value ? 'selected' : ''}`}
              onClick={() => handleColorSelect(color.value)}
              title={color.name}
              style={{ 
                background: color.gradient,
                border: newTeamColor === color.value ? '3px solid #000' : '2px solid #ddd'
              }}
            />
          ))}
        </div>
      </div>

      <button type="submit" className="btn-primary">
        Добавить команду
      </button>
    </form>
  )
}

export default TeamForm
