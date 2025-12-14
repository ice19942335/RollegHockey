import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function TournamentRoundGenerator({ teams }) {
  const { t } = useLanguage()
  const [selectedTeams, setSelectedTeams] = useState([])
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState('')
  const [selectedNumber, setSelectedNumber] = useState('')

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

  return (
    <div className="tournament-round-generator">
      <h2>{t('tournamentRoundGenerator')}</h2>
      
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
        <label className="round-generator-number-label">{t('selectNumber')}:</label>
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
            className="round-generator-generate-btn"
            onClick={() => {}}
            disabled={!selectedNumber}
          >
            {t('generate')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TournamentRoundGenerator

