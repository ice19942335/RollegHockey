import { useCallback, useMemo } from 'react'
import { DEFAULT_TEAM_LOGOS, TEAM_COLORS } from '../constants/teamDefaults'
import { useLanguage } from '../i18n/LanguageContext'

function TeamForm({ 
  newTeamName, 
  setNewTeamName, 
  newTeamLogo, 
  setNewTeamLogo,
  newTeamColor,
  setNewTeamColor,
  onAddTeam 
}) {
  const { t } = useLanguage()
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    onAddTeam()
  }, [onAddTeam])

  const handleLogoSelect = useCallback((emoji) => {
    setNewTeamLogo(emoji)
  }, [setNewTeamLogo])

  const handleColorSelect = useCallback((color) => {
    setNewTeamColor(color)
  }, [setNewTeamColor])

  // Мемоизируем стили для цветов
  const colorStyles = useMemo(() => {
    return TEAM_COLORS.reduce((acc, color) => {
      acc[color.id] = {
        background: color.gradient
      }
      return acc
    }, {})
  }, [])

  return (
    <form className="team-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={newTeamName}
        onChange={(e) => setNewTeamName(e.target.value)}
        placeholder={t('teamNamePlaceholder')}
        required
      />
      
      <div className="logo-selection">
        <label>{t('selectLogo')}</label>
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
        <label>{t('selectColor')}</label>
        <div className="color-options">
          {TEAM_COLORS.map(color => (
            <button
              key={color.id}
              type="button"
              className={`color-option ${newTeamColor === color.value ? 'selected' : ''}`}
              onClick={() => handleColorSelect(color.value)}
              title={color.name}
              style={colorStyles[color.id]}
              data-color-value={color.value}
            />
          ))}
        </div>
      </div>

      <button type="submit" className="btn-primary">
        {t('addTeam')}
      </button>
    </form>
  )
}

export default TeamForm
