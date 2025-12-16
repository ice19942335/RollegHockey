import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { generateRoundRobinGames } from '../utils/generateRounds'

function TournamentRoundGenerator({ teams, tournamentId, onGamesGenerated, onNotification }) {
  const { t } = useLanguage()
  const [selectedTeams, setSelectedTeams] = useState([])
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState('')
  const [selectedNumber, setSelectedNumber] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Доступные команды для основного дропдауна (исключая уже добавленные)
  const availableTeams = teams.filter(team => 
    !selectedTeams.includes(team.id)
  )

  // Добавление команды в список
  const handleAddTeam = () => {
    if (selectedTeamToAdd && !selectedTeams.includes(selectedTeamToAdd)) {
      setSelectedTeams([...selectedTeams, selectedTeamToAdd])
      setSelectedTeamToAdd('')
    }
  }

  // Добавление всех команд в список
  const handleAddAllTeams = () => {
    const allTeamIds = teams.map(team => team.id)
    setSelectedTeams(allTeamIds)
    setSelectedTeamToAdd('')
  }

  // Изменение команды в списке
  const handleChangeTeam = (index, newTeamId) => {
    if (!newTeamId) return
    
    // Проверяем, что новая команда не дублируется
    const isDuplicate = selectedTeams.some((id, idx) => idx !== index && id === newTeamId)
    if (isDuplicate) return

    const updatedTeams = [...selectedTeams]
    updatedTeams[index] = newTeamId
    setSelectedTeams(updatedTeams)
  }

  // Удаление команды из списка
  const handleRemoveTeam = (index) => {
    const updatedTeams = selectedTeams.filter((_, idx) => idx !== index)
    setSelectedTeams(updatedTeams)
  }

  // Получение доступных команд для элемента списка
  // Включает текущую команду и все команды, которых нет в списке (кроме текущей позиции)
  const getAvailableTeamsForItem = (currentTeamId, currentIndex) => {
    return teams.filter(team => {
      // Всегда включаем текущую команду
      if (team.id === currentTeamId) return true
      // Исключаем команды, которые уже есть в списке (кроме текущей позиции)
      return !selectedTeams.some((id, idx) => idx !== currentIndex && id === team.id)
    })
  }

  // Получение объекта команды по ID
  const getTeamById = (teamId) => {
    return teams.find(team => team.id === teamId)
  }

  // Обработчик генерации игр
  const handleGenerate = async () => {
    // Проверяем, что выбраны команды (минимум 2)
    if (selectedTeams.length < 2) {
      if (onNotification) {
        onNotification('Выберите минимум 2 команды', 'error')
      }
      return
    }

    // Проверяем, что выбрано количество туров
    if (!selectedNumber || parseInt(selectedNumber) < 1) {
      if (onNotification) {
        onNotification('Выберите количество туров', 'error')
      }
      return
    }

    setIsGenerating(true)

    try {
      // Генерируем игры
      const rounds = parseInt(selectedNumber)
      const newGames = generateRoundRobinGames(selectedTeams, rounds)

      if (newGames.length === 0) {
        if (onNotification) {
          onNotification('Не удалось сгенерировать игры', 'error')
        }
        setIsGenerating(false)
        return
      }

      // Вызываем callback для сохранения игр
      if (onGamesGenerated) {
        await onGamesGenerated(newGames)
      }

      // Очищаем форму после успешной генерации
      setSelectedTeams([])
      setSelectedTeamToAdd('')
      setSelectedNumber('')
      
      if (onNotification) {
        onNotification(`Сгенерировано игр: ${newGames.length} ✓`, 'success')
      }
    } catch (error) {
      console.error('Ошибка генерации игр:', error)
      if (onNotification) {
        onNotification('Ошибка генерации игр', 'error')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="tournament-round-generator">
      {/* Переключатель типа генерации */}
      <div className="round-generator-type-toggle">
        <label className="round-generator-type-label">
          <input
            type="checkbox"
            checked={true}
            readOnly
            className="round-generator-type-checkbox"
          />
          <span className="round-generator-type-text">{t('roundRobinType')}</span>
        </label>
      </div>
      
      <div className="round-generator-controls">
        <select
          className="round-generator-team-select"
          value={selectedTeamToAdd}
          onChange={(e) => setSelectedTeamToAdd(e.target.value)}
        >
          <option value="">{t('selectTeamToAdd')}</option>
          {availableTeams.map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <button
          className="round-generator-add-btn"
          onClick={handleAddTeam}
          disabled={!selectedTeamToAdd}
        >
          +
        </button>
      </div>
      
      {teams.length > 0 && (
        <button
          className="round-generator-add-all-btn"
          onClick={handleAddAllTeams}
          disabled={selectedTeams.length === teams.length}
        >
          {t('addAllTeams')}
        </button>
      )}

      {selectedTeams.length > 0 ? (
        <div className="round-generator-list">
          <h3>{t('selectedTeams')}:</h3>
          {selectedTeams.map((teamId, index) => {
            const team = getTeamById(teamId)
            const availableTeamsForItem = getAvailableTeamsForItem(teamId, index)
            
            // Пропускаем, если команда не найдена (может быть удалена из турнира)
            if (!team) return null
            
            return (
              <div key={index} className="round-generator-item">
                <select
                  className="round-generator-team-select"
                  value={teamId}
                  onChange={(e) => handleChangeTeam(index, e.target.value)}
                >
                  {availableTeamsForItem.map(availableTeam => (
                    <option key={availableTeam.id} value={availableTeam.id}>
                      {availableTeam.name}
                    </option>
                  ))}
                </select>
                <button
                  className="round-generator-remove-btn"
                  onClick={() => handleRemoveTeam(index)}
                  title={t('removeTeam')}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="round-generator-empty">{t('noTeamsSelected')}</p>
      )}

      <div className="round-generator-generate-wrapper">
        <div className="round-generator-generate-controls">
          <select
            className="round-generator-number-select"
            value={selectedNumber}
            onChange={(e) => setSelectedNumber(e.target.value)}
          >
            <option value="">{t('selectNumber')}</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <button
            className={`round-generator-generate-btn ${isGenerating ? 'btn-loading' : ''}`}
            onClick={handleGenerate}
            disabled={!selectedNumber || selectedTeams.length < 2 || isGenerating}
          >
            {isGenerating && <span className="btn-spinner"></span>}
            {isGenerating ? t('generating') : t('generate')}
          </button>
        </div>
      </div>

    </div>
  )
}

export default TournamentRoundGenerator

