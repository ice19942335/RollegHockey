import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_TEAM_LOGOS, TEAM_COLORS } from '../constants/teamDefaults'
import { useLanguage } from '../i18n/LanguageContext'
import { generateRandomTeams } from '../utils/generateRandomTeams'

function TeamForm({ 
  newTeamName, 
  setNewTeamName, 
  newTeamLogo, 
  setNewTeamLogo,
  newTeamColor,
  setNewTeamColor,
  onAddTeam,
  onGenerateTeams,
  existingTeams = [],
  language = 'ru',
  onGeneratingStart
}) {
  const { t } = useLanguage()
  const [selectedCount, setSelectedCount] = useState('')
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    onAddTeam()
  }, [onAddTeam])

  const handleLogoSelect = useCallback((emoji) => {
    setNewTeamLogo(emoji)
  }, [setNewTeamLogo])

  // Мемоизируем обработчики для каждого логотипа
  const logoHandlers = useMemo(() => {
    return DEFAULT_TEAM_LOGOS.reduce((acc, logo) => {
      acc[logo.id] = () => handleLogoSelect(logo.emoji)
      return acc
    }, {})
  }, [handleLogoSelect])

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

  const handleGenerateTeams = useCallback(() => {
    if (!selectedCount || parseInt(selectedCount) < 1) {
      console.warn('Количество команд не выбрано')
      return
    }

    // Блокируем приложение СРАЗУ при нажатии кнопки, до начала генерации
    if (onGeneratingStart) {
      onGeneratingStart()
    }

    // Используем setTimeout с небольшой задержкой, чтобы React успел обновить UI и показать блокировку
    setTimeout(() => {
      const count = parseInt(selectedCount)
      console.log('Генерация команд:', { count, language, existingTeamsCount: existingTeams.length })
      
      const generatedTeams = generateRandomTeams(count, language, existingTeams)
      console.log('Сгенерированные команды:', generatedTeams)
      
      if (generatedTeams.length > 0 && onGenerateTeams) {
        onGenerateTeams(generatedTeams)
        setSelectedCount('')
      } else {
        console.warn('Не удалось сгенерировать команды или отсутствует обработчик', {
          generatedTeamsLength: generatedTeams.length,
          hasOnGenerateTeams: !!onGenerateTeams
        })
        // Если генерация не удалась, нужно снять блокировку
        if (onGenerateTeams) {
          onGenerateTeams([])
        }
      }
    }, 50) // Небольшая задержка для отображения блокировки
  }, [selectedCount, language, existingTeams, onGenerateTeams, onGeneratingStart])

  return (
    <form className="team-form" onSubmit={handleSubmit}>
      {/* Автоматическая генерация команд */}
      <div className="team-form-section team-form-section-generate">
        <h3 className="team-form-section-title">{t('generateTeams')}</h3>
        <div className="team-generator-controls">
          <select
            className="team-generator-select"
            value={selectedCount}
            onChange={(e) => setSelectedCount(e.target.value)}
          >
            <option value="">{t('selectTeamCount')}</option>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="team-generator-btn"
            onClick={handleGenerateTeams}
            disabled={!selectedCount}
          >
            {t('generateTeams')}
          </button>
        </div>
      </div>

      {/* Разделитель */}
      <div className="team-form-divider">
        <span className="team-form-divider-text">{t('or') || 'или'}</span>
      </div>

      {/* Ручной ввод команды */}
      <div className="team-form-section team-form-section-manual">
        <h3 className="team-form-section-title">{t('addTeam')}</h3>
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
                onClick={logoHandlers[logo.id]}
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
      </div>
    </form>
  )
}

export default TeamForm
