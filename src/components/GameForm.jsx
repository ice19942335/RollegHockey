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
    }
  }

  return (
    <form className="game-form" onSubmit={handleSubmit}>
      <div className="game-teams">
        <select
          value={selectedHomeTeam}
          onChange={(e) => setSelectedHomeTeam(e.target.value)}
          required
        >
          <option value="">Выберите домашнюю команду</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <span className="vs">VS</span>
        <select
          value={selectedAwayTeam}
          onChange={(e) => setSelectedAwayTeam(e.target.value)}
          required
        >
          <option value="">Выберите гостевую команду</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
      </div>
      
      <div className="game-score">
        <div className="score-control">
          <button
            type="button"
            className="score-btn score-btn-minus"
            onClick={decrementHomeScore}
            disabled={!selectedHomeTeam || (parseInt(homeScore) || 0) === 0}
          >
            −
          </button>
          <input
            type="number"
            min="0"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
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
          <button
            type="button"
            className="score-btn score-btn-minus"
            onClick={decrementAwayScore}
            disabled={!selectedAwayTeam || (parseInt(awayScore) || 0) === 0}
          >
            −
          </button>
          <input
            type="number"
            min="0"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
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
          Основное время
        </label>
        <label>
          <input
            type="radio"
            value="overtime"
            checked={gameType === 'overtime'}
            onChange={(e) => setGameType(e.target.value)}
          />
          Овертайм
        </label>
        <label>
          <input
            type="radio"
            value="shootout"
            checked={gameType === 'shootout'}
            onChange={(e) => setGameType(e.target.value)}
          />
          Буллиты
        </label>
      </div>

      <div className="game-form-actions">
        <button 
          type="button"
          className="btn-scoreboard"
          onClick={onOpenScoreboard}
          disabled={!selectedHomeTeam || !selectedAwayTeam}
        >
          📺 Открыть табло
        </button>
        <button 
          type="submit"
          className="btn-primary"
          disabled={!isFormValid}
        >
          Добавить игру
        </button>
      </div>
    </form>
  )
}

export default GameForm

