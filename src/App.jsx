import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import TeamForm from './components/TeamForm'
import TeamList from './components/TeamList'
import GameForm from './components/GameForm'
import GamesList from './components/GamesList'
import StandingsTable from './components/StandingsTable'
import Scoreboard from './components/Scoreboard'
import ConfirmModal from './components/ConfirmModal'
import { config, DEFAULT_TEAMS } from './config'

function App() {
  const [teams, setTeams] = useState(() => {
    // Если режим разработки, загружаем дефолтные команды
    if (config.IsDev) {
      return DEFAULT_TEAMS
    }
    return []
  })
  const [games, setGames] = useState([])
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamLogo, setNewTeamLogo] = useState('🏒')
  const [newTeamColor, setNewTeamColor] = useState('#1e3c72')
  const [selectedHomeTeam, setSelectedHomeTeam] = useState('')
  const [selectedAwayTeam, setSelectedAwayTeam] = useState('')
  const [homeScore, setHomeScore] = useState('0')
  const [awayScore, setAwayScore] = useState('0')
  const [gameType, setGameType] = useState('regular')
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const addTeam = () => {
    if (newTeamName.trim() && !teams.find(t => t.name === newTeamName.trim())) {
      setTeams([...teams, {
        id: Date.now(),
        name: newTeamName.trim(),
        logo: newTeamLogo.trim() || '🏒',
        color: newTeamColor || '#1e3c72'
      }])
      setNewTeamName('')
      setNewTeamLogo('🏒')
      setNewTeamColor('#1e3c72')
    }
  }

  const deleteTeam = (id) => {
    setTeams(teams.filter(t => t.id !== id))
    setGames(games.filter(g => g.homeTeamId !== id && g.awayTeamId !== id))
  }

  const updateTeamName = (id, newName) => {
    if (newName.trim() && !teams.find(t => t.id !== id && t.name === newName.trim())) {
      setTeams(teams.map(team => 
        team.id === id ? { ...team, name: newName.trim() } : team
      ))
    }
  }

  const addGame = () => {
    if (selectedHomeTeam && selectedAwayTeam && 
        selectedHomeTeam !== selectedAwayTeam &&
        homeScore !== '' && awayScore !== '' &&
        parseInt(homeScore) >= 0 && parseInt(awayScore) >= 0) {
      
      const homeScoreInt = parseInt(homeScore)
      const awayScoreInt = parseInt(awayScore)

      setGames([...games, {
        id: Date.now(),
        homeTeamId: parseInt(selectedHomeTeam),
        awayTeamId: parseInt(selectedAwayTeam),
        homeScore: homeScoreInt,
        awayScore: awayScoreInt,
        gameType: gameType,
        date: new Date().toLocaleDateString('ru-RU')
      }])
      
      setSelectedHomeTeam('')
      setSelectedAwayTeam('')
      setHomeScore('0')
      setAwayScore('0')
      setGameType('regular')
    }
  }

  const deleteGame = (id) => {
    setGames(games.filter(g => g.id !== id))
  }

  const handleDeleteAllGames = () => {
    setShowConfirmModal(true)
  }

  const confirmDeleteAllGames = () => {
    setGames([])
    setShowConfirmModal(false)
  }

  const cancelDeleteAllGames = () => {
    setShowConfirmModal(false)
  }

  const openScoreboard = () => {
    if (selectedHomeTeam && selectedAwayTeam) {
      setShowScoreboard(true)
    }
  }

  const closeScoreboard = () => {
    setShowScoreboard(false)
  }

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

  const homeTeam = teams.find(t => t.id === parseInt(selectedHomeTeam))
  const awayTeam = teams.find(t => t.id === parseInt(selectedAwayTeam))

  return (
    <div className="app">
      {showScoreboard && (
        <Scoreboard
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeScore={homeScore || 0}
          awayScore={awayScore || 0}
          gameType={gameType}
          onClose={closeScoreboard}
          onIncrementHomeScore={incrementHomeScore}
          onDecrementHomeScore={decrementHomeScore}
          onIncrementAwayScore={incrementAwayScore}
          onDecrementAwayScore={decrementAwayScore}
        />
      )}
      <Header />

      <main className="main">
        <section className="section">
          <h2>Добавить команду</h2>
          <TeamForm
            newTeamName={newTeamName}
            setNewTeamName={setNewTeamName}
            newTeamLogo={newTeamLogo}
            setNewTeamLogo={setNewTeamLogo}
            newTeamColor={newTeamColor}
            setNewTeamColor={setNewTeamColor}
            onAddTeam={addTeam}
          />
          <TeamList 
            teams={teams} 
            onDeleteTeam={deleteTeam}
            onUpdateTeamName={updateTeamName}
          />
        </section>

        {teams.length >= 2 && (
          <section className="section">
            <h2>Добавить игру</h2>
            <GameForm
              teams={teams}
              selectedHomeTeam={selectedHomeTeam}
              setSelectedHomeTeam={setSelectedHomeTeam}
              selectedAwayTeam={selectedAwayTeam}
              setSelectedAwayTeam={setSelectedAwayTeam}
              homeScore={homeScore}
              setHomeScore={setHomeScore}
              awayScore={awayScore}
              setAwayScore={setAwayScore}
              gameType={gameType}
              setGameType={setGameType}
              onAddGame={addGame}
              onOpenScoreboard={openScoreboard}
            />
          </section>
        )}

        <StandingsTable teams={teams} games={games} />

        <GamesList 
          games={games} 
          teams={teams} 
          onDeleteGame={deleteGame}
          onDeleteAllGames={handleDeleteAllGames}
        />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={cancelDeleteAllGames}
        onConfirm={confirmDeleteAllGames}
        title="Удалить все игры?"
        message={`Вы уверены, что хотите удалить все ${games.length} игр? Это действие нельзя отменить.`}
      />
      </main>

      <Footer />
    </div>
  )
}

export default App
