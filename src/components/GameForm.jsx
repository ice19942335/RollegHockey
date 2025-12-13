import { useLanguage } from '../i18n/LanguageContext'

function GameForm({ 
  teams, 
  selectedHomeTeam, 
  setSelectedHomeTeam,
  selectedAwayTeam, 
  setSelectedAwayTeam,
  homeScore, 
  setHomeScore,
  awayScore, 
  setAwayScore,
  gameType, 
  setGameType,
  onAddGame,
  onOpenScoreboard
}) {
  const { t } = useLanguage()
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onAddGame()
  }

  const isFormValid = selectedHomeTeam && 
                      selectedAwayTeam && 
                      selectedHomeTeam !== selectedAwayTeam &&
                      homeScore !== '' && 
                      awayScore !== '' &&
                      parseInt(homeScore) >= 0 && 
                      parseInt(awayScore) >= 0

  const incrementHomeScore = () => {
    const current = parseInt(homeScore) || 0
    setHomeScore((current + 1).toString())
  }

  const decrementHomeScore = () => {
    const current = parseInt(homeScore) || 0
    if (current > 0) {
      setHomeScore((current - 1).toString())
    } else {
      setHomeScore('0')
    }
  }

  const incrementAwayScore = () => {
    const current = parseInt(awayScore) || 0
    setAwayScore((current + 1).toString())
  }

  const decrementAwayScore = () => {
    const current = parseInt(awayScore) || 0
    if (current > 0) {
      setAwayScore((current - 1).toString())
    } else {
      setAwayScore('0')
    }
  }

  const handleHomeTeamChange = (e) => {
    const selectedId = e.target.value
    setSelectedHomeTeam(selectedId)
    // Если выбрана та же команда, что и гостевая, сбрасываем гостевую
    if (selectedId === selectedAwayTeam) {
      setSelectedAwayTeam('')
    }
  }

  const handleAwayTeamChange = (e) => {
    const selectedId = e.target.value
    setSelectedAwayTeam(selectedId)
    // Если выбрана та же команда, что и домашняя, сбрасываем домашнюю
    if (selectedId === selectedHomeTeam) {
      setSelectedHomeTeam('')
    }
  }

  // Фильтруем команды для списков
  const availableHomeTeams = teams.filter(team => team.id.toString() !== selectedAwayTeam)
  const availableAwayTeams = teams.filter(team => team.id.toString() !== selectedHomeTeam)

  return (
    <form className="game-form" onSubmit={handleSubmit}>
      <div className="game-teams">
        <select
          value={selectedHomeTeam}
          onChange={handleHomeTeamChange}
          required
        >
          <option value="">{t('selectHomeTeam')}</option>
          {availableHomeTeams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <span className="vs">VS</span>
        <select
          value={selectedAwayTeam}
          onChange={handleAwayTeamChange}
          required
        >
          <option value="">{t('selectAwayTeam')}</option>
          {availableAwayTeams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>
      
      <div className="game-score">
        <div className="score-control">
          {selectedHomeTeam && parseInt(homeScore || '0') > 0 ? (
            <button
              type="button"
              className="score-btn score-btn-minus"
              onClick={decrementHomeScore}
            >
              −
            </button>
          ) : (
            <div className="score-btn-placeholder"></div>
          )}
          <input
            type="number"
            min="0"
            value={homeScore || '0'}
            onChange={(e) => setHomeScore(e.target.value || '0')}
            placeholder="0"
            disabled={!selectedHomeTeam}
            required
          />
          <button
            type="button"
            className="score-btn score-btn-plus"
            onClick={incrementHomeScore}
            disabled={!selectedHomeTeam}
          >
            +
          </button>
        </div>
        <span className="score-separator">:</span>
        <div className="score-control">
          {selectedAwayTeam && parseInt(awayScore || '0') > 0 ? (
            <button
              type="button"
              className="score-btn score-btn-minus"
              onClick={decrementAwayScore}
            >
              −
            </button>
          ) : (
            <div className="score-btn-placeholder"></div>
          )}
          <input
            type="number"
            min="0"
            value={awayScore || '0'}
            onChange={(e) => setAwayScore(e.target.value || '0')}
            placeholder="0"
            disabled={!selectedAwayTeam}
            required
          />
          <button
            type="button"
            className="score-btn score-btn-plus"
            onClick={incrementAwayScore}
            disabled={!selectedAwayTeam}
          >
            +
          </button>
        </div>
      </div>

      <div className="game-type">
        <label>
          <input
            type="radio"
            value="regular"
            checked={gameType === 'regular'}
            onChange={(e) => setGameType(e.target.value)}
          />
          {t('gameTypeRegular')}
        </label>
        <label>
          <input
            type="radio"
            value="shootout"
            checked={gameType === 'shootout'}
            onChange={(e) => setGameType(e.target.value)}
          />
          {t('gameTypeShootout')}
        </label>
      </div>

      <div className="game-form-actions">
        <button 
          type="button"
          className="btn-scoreboard"
          onClick={onOpenScoreboard}
          disabled={!selectedHomeTeam || !selectedAwayTeam}
        >
          {t('openScoreboard')}
        </button>
        <button 
          type="submit"
          className="btn-primary"
          disabled={!isFormValid}
        >
          {t('addGame')}
        </button>
      </div>
    </form>
  )
}

export default GameForm

