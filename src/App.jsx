import { useState, useEffect, useRef } from 'react'
import './App.css'
import Header from './components/Header'
import { useLanguage } from './i18n/LanguageContext'
import TeamForm from './components/TeamForm'
import TeamList from './components/TeamList'
import GameForm from './components/GameForm'
import GamesList from './components/GamesList'
import StandingsTable from './components/StandingsTable'
import Scoreboard from './components/Scoreboard'
import ConfirmModal from './components/ConfirmModal'
import MissingTeamModal from './components/MissingTeamModal'
import DeleteTeamModal from './components/DeleteTeamModal'
import { loadDataFromSheets, saveDataToSheets } from './utils/googleSheets'
import { calculateStandings } from './utils/calculateStats'

function App() {
  const { t } = useLanguage()
  const [teams, setTeams] = useState([])
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
  const [showMissingTeamModal, setShowMissingTeamModal] = useState(false)
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState(null)
  const [relatedGamesToDelete, setRelatedGamesToDelete] = useState([])
  const [missingTeams, setMissingTeams] = useState([])
  const [pendingGameData, setPendingGameData] = useState(null) // Хранит данные игры, ожидающей подтверждения
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savingSeconds, setSavingSeconds] = useState(0) // Счетчик секунд сохранения
  const savingIntervalRef = useRef(null) // Ref для хранения интервала счетчика
  const savingTimeoutRef = useRef(null) // Ref для хранения timeout счетчика
  const isInitialLoadRef = useRef(true)
  const previousDataRef = useRef({ teams: [], games: [] })
  const hasLoadedRef = useRef(false) // Флаг для предотвращения повторной загрузки
  const isAddingGameRef = useRef(false) // Флаг для отслеживания процесса добавления игры
  
  // Функция загрузки данных из Google Sheets
  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const data = await loadDataFromSheets()
      if (data.teams.length > 0 || data.games.length > 0) {
        setTeams(data.teams)
        setGames(data.games)
        // Сохраняем загруженные данные как предыдущие
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(data.teams)),
          games: JSON.parse(JSON.stringify(data.games))
        }
      }
      return data // Возвращаем загруженные данные
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      return { teams: [], games: [] }
    } finally {
      // Всегда сбрасываем флаг загрузки, даже при ошибке
      if (showLoading) {
        setIsLoading(false)
        isInitialLoadRef.current = false
      }
    }
  }
  
  // Загрузка данных из Google Sheets при старте
  useEffect(() => {
    // Предотвращаем повторную загрузку (защита от StrictMode)
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    loadData(true) // Показываем индикатор загрузки только при первой загрузке
  }, [])
  
  // Счетчик секунд при сохранении
  useEffect(() => {
    // Очищаем предыдущие таймеры, если они существуют
    if (savingIntervalRef.current) {
      clearInterval(savingIntervalRef.current)
      savingIntervalRef.current = null
    }
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current)
      savingTimeoutRef.current = null
    }
    
    if (isSaving) {
      // Сбрасываем счетчик при начале сохранения
      setSavingSeconds(0)
      
      // Запускаем интервал сразу, он будет обновлять счетчик каждую секунду
      savingIntervalRef.current = setInterval(() => {
        setSavingSeconds(prev => prev + 1)
      }, 1000)
    } else {
      // Сбрасываем счетчик при завершении сохранения
      setSavingSeconds(0)
    }
    
    return () => {
      if (savingIntervalRef.current) {
        clearInterval(savingIntervalRef.current)
        savingIntervalRef.current = null
      }
      if (savingTimeoutRef.current) {
        clearTimeout(savingTimeoutRef.current)
        savingTimeoutRef.current = null
      }
    }
  }, [isSaving])
  
  // Автосохранение при изменении teams или games (только если данные реально изменились)
  useEffect(() => {
    // Не сохраняем во время начальной загрузки
    if (isLoading || isInitialLoadRef.current) return
    
    // Не сохраняем, если идет процесс добавления игры (он сам управляет сохранением)
    if (isAddingGameRef.current) return
    
    // Сравниваем текущие данные с предыдущими
    const currentDataStr = JSON.stringify({ teams, games })
    const previousDataStr = JSON.stringify(previousDataRef.current)
    
    // Если данные не изменились, не сохраняем
    if (currentDataStr === previousDataStr) return
    
    // Обновляем предыдущие данные
    previousDataRef.current = {
      teams: JSON.parse(JSON.stringify(teams)),
      games: JSON.parse(JSON.stringify(games))
    }
    
    // Сохраняем данные немедленно
    const saveData = async () => {
      setIsSaving(true)
      try {
        // Вычисляем турнирную таблицу перед сохранением
        const standings = calculateStandings(teams, games)
        await saveDataToSheets(teams, games, standings)
      } catch (error) {
        console.error('Ошибка сохранения данных:', error)
      } finally {
        setIsSaving(false)
      }
    }
    
    saveData()
  }, [teams, games, isLoading])

  const addTeam = () => {
    if (newTeamName.trim() && !teams.find(t => t.name === newTeamName.trim())) {
      setTeams([...teams, {
        id: String(Date.now()), // Преобразуем в строку для единообразия
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
    // Находим команду для удаления
    const team = teams.find(t => String(t.id) === String(id))
    if (!team) return
    
    // Находим все игры, связанные с этой командой
    const relatedGames = games.filter(g => 
      String(g.homeTeamId) === String(id) || String(g.awayTeamId) === String(id)
    )
    
    // Если есть связанные игры, показываем модальное окно
    if (relatedGames.length > 0) {
      setTeamToDelete(team)
      setRelatedGamesToDelete(relatedGames)
      setShowDeleteTeamModal(true)
    } else {
      // Если игр нет, удаляем команду сразу
      confirmDeleteTeam(id)
    }
  }
  
  const confirmDeleteTeam = (id) => {
    setTeams(teams.filter(t => String(t.id) !== String(id)))
    setGames(games.filter(g => String(g.homeTeamId) !== String(id) && String(g.awayTeamId) !== String(id)))
    setShowDeleteTeamModal(false)
    setTeamToDelete(null)
    setRelatedGamesToDelete([])
  }
  
  const cancelDeleteTeam = () => {
    setShowDeleteTeamModal(false)
    setTeamToDelete(null)
    setRelatedGamesToDelete([])
  }

  const updateTeamName = (id, newName) => {
    if (newName.trim() && !teams.find(t => t.id !== id && t.name === newName.trim())) {
      setTeams(teams.map(team => 
        team.id === id ? { ...team, name: newName.trim() } : team
      ))
    }
  }

  const addGame = async () => {
    if (selectedHomeTeam && selectedAwayTeam && 
        selectedHomeTeam !== selectedAwayTeam &&
        homeScore !== '' && awayScore !== '' &&
        parseInt(homeScore) >= 0 && parseInt(awayScore) >= 0) {
      
      // Устанавливаем флаг, что идет процесс добавления игры
      isAddingGameRef.current = true
      
      // Показываем оверлей сразу
      setIsSaving(true)
      
      try {
        // 1. Синхронизируем данные с Google Sheets перед добавлением игры
        const freshData = await loadData(false) // Загружаем свежие данные без показа индикатора загрузки
        
        // Проверяем наличие команд в свежих данных
        const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
        const homeTeamFound = currentTeams.find(t => String(t.id) === String(selectedHomeTeam))
        const awayTeamFound = currentTeams.find(t => String(t.id) === String(selectedAwayTeam))
        
        const missingTeamsList = []
        if (!homeTeamFound) {
          const homeTeam = teams.find(t => String(t.id) === String(selectedHomeTeam))
          if (homeTeam) {
            missingTeamsList.push(homeTeam)
          }
        }
        if (!awayTeamFound) {
          const awayTeam = teams.find(t => String(t.id) === String(selectedAwayTeam))
          if (awayTeam) {
            missingTeamsList.push(awayTeam)
          }
        }
        
        // Если есть недостающие команды, показываем модальное окно
        if (missingTeamsList.length > 0) {
          setIsSaving(false) // Скрываем оверлей сохранения
          
          // Сохраняем данные игры для последующего использования
          const homeScoreInt = parseInt(homeScore)
          const awayScoreInt = parseInt(awayScore)
          
          setPendingGameData({
            homeTeamId: String(selectedHomeTeam),
            awayTeamId: String(selectedAwayTeam),
            homeScore: homeScoreInt,
            awayScore: awayScoreInt,
            gameType: gameType,
            freshData: freshData,
            currentTeams: currentTeams
          })
          
          setMissingTeams(missingTeamsList)
          setShowMissingTeamModal(true)
          isAddingGameRef.current = false
          return // Прерываем выполнение, ждем решения пользователя
        }
        
        // 2. Добавляем игру в свежие данные (команды найдены)
        const homeScoreInt = parseInt(homeScore)
        const awayScoreInt = parseInt(awayScore)
        
        // Используем свежие данные или текущие, если загрузка не удалась
        const currentGames = freshData.games.length > 0 ? freshData.games : games
        
        // Генерируем уникальный ID, проверяя существующие ID
        let newGameId
        do {
          newGameId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        } while (currentGames.some(game => game.id === newGameId))
        
        const newGame = {
          id: newGameId, // Уникальный ID с временной меткой и случайной строкой
          homeTeamId: String(selectedHomeTeam), // Преобразуем в строку для единообразия
          awayTeamId: String(selectedAwayTeam), // Преобразуем в строку для единообразия
          homeScore: homeScoreInt,
          awayScore: awayScoreInt,
          gameType: gameType,
          date: new Date().toLocaleDateString('ru-RU')
        }
        
        const updatedGames = [...currentGames, newGame]
        
        // Обновляем состояние с новой игрой
        setGames(updatedGames)
        if (freshData.teams.length > 0) {
          setTeams(currentTeams)
        }
        
        // Обновляем previousDataRef, чтобы автосохранение не сработало
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(currentTeams)),
          games: JSON.parse(JSON.stringify(updatedGames))
        }
        
        // 3. Сохраняем данные в Google Sheets сразу после добавления игры
        const standings = calculateStandings(currentTeams, updatedGames)
        await saveDataToSheets(currentTeams, updatedGames, standings)
        
        // Очищаем форму
        setSelectedHomeTeam('')
        setSelectedAwayTeam('')
        setHomeScore('0')
        setAwayScore('0')
        setGameType('regular')
      } catch (error) {
        console.error('Ошибка при синхронизации перед добавлением игры:', error)
        // В случае ошибки все равно добавляем игру в текущие данные
        const homeScoreInt = parseInt(homeScore)
        const awayScoreInt = parseInt(awayScore)
        
        // Генерируем уникальный ID, проверяя существующие ID
        let newGameId
        do {
          newGameId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        } while (games.some(game => game.id === newGameId))
        
        const newGame = {
          id: newGameId, // Уникальный ID с временной меткой и случайной строкой
          homeTeamId: String(selectedHomeTeam),
          awayTeamId: String(selectedAwayTeam),
          homeScore: homeScoreInt,
          awayScore: awayScoreInt,
          gameType: gameType,
          date: new Date().toLocaleDateString('ru-RU')
        }
        
        const updatedGames = [...games, newGame]
        setGames(updatedGames)
        
        // Обновляем previousDataRef
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(teams)),
          games: JSON.parse(JSON.stringify(updatedGames))
        }
        
        // Пытаемся сохранить даже при ошибке синхронизации
        try {
          const standings = calculateStandings(teams, updatedGames)
          await saveDataToSheets(teams, updatedGames, standings)
        } catch (saveError) {
          console.error('Ошибка сохранения данных:', saveError)
        }
        
        setSelectedHomeTeam('')
        setSelectedAwayTeam('')
        setHomeScore('0')
        setAwayScore('0')
        setGameType('regular')
      } finally {
        // Сбрасываем флаг процесса добавления игры
        isAddingGameRef.current = false
        // Скрываем оверлей только после завершения всего процесса
        setIsSaving(false)
      }
    }
  }
  
  // Обработчик подтверждения создания недостающих команд
  const handleConfirmMissingTeams = async () => {
    if (!pendingGameData) return
    
    setIsSaving(true)
    setShowMissingTeamModal(false)
    
    try {
      // Создаем недостающие команды заново
      const updatedTeams = [...pendingGameData.currentTeams]
      
      for (const missingTeam of missingTeams) {
        // Проверяем, не существует ли уже команда с таким ID
        const existingTeam = updatedTeams.find(t => String(t.id) === String(missingTeam.id))
        if (!existingTeam) {
          const newTeam = {
            id: String(missingTeam.id), // Сохраняем оригинальный ID
            name: missingTeam.name,
            logo: missingTeam.logo || '🏒',
            color: missingTeam.color || '#1e3c72'
          }
          updatedTeams.push(newTeam)
        }
      }
      
      const currentGames = pendingGameData.freshData.games.length > 0 
        ? pendingGameData.freshData.games 
        : games
      
      // Генерируем уникальный ID, проверяя существующие ID
      let newGameId
      do {
        newGameId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      } while (currentGames.some(game => game.id === newGameId))
      
      // Создаем игру
      const newGame = {
        id: newGameId, // Уникальный ID с временной меткой и случайной строкой
        homeTeamId: pendingGameData.homeTeamId,
        awayTeamId: pendingGameData.awayTeamId,
        homeScore: pendingGameData.homeScore,
        awayScore: pendingGameData.awayScore,
        gameType: pendingGameData.gameType,
        date: new Date().toLocaleDateString('ru-RU')
      }
      
      const updatedGames = [...currentGames, newGame]
      
      // Обновляем состояние
      setTeams(updatedTeams)
      setGames(updatedGames)
      
      // Обновляем previousDataRef
      previousDataRef.current = {
        teams: JSON.parse(JSON.stringify(updatedTeams)),
        games: JSON.parse(JSON.stringify(updatedGames))
      }
      
      // Сохраняем данные в Google Sheets
      const standings = calculateStandings(updatedTeams, updatedGames)
      await saveDataToSheets(updatedTeams, updatedGames, standings)
      
      // Очищаем форму
      setSelectedHomeTeam('')
      setSelectedAwayTeam('')
      setHomeScore('0')
      setAwayScore('0')
      setGameType('regular')
      
      // Очищаем данные ожидающей игры
      setPendingGameData(null)
      setMissingTeams([])
    } catch (error) {
      console.error('Ошибка при создании команд и сохранении игры:', error)
    } finally {
      setIsSaving(false)
      isAddingGameRef.current = false
    }
  }
  
  // Обработчик отмены создания недостающих команд
  const handleCancelMissingTeams = () => {
    setShowMissingTeamModal(false)
    setPendingGameData(null)
    setMissingTeams([])
    isAddingGameRef.current = false
    setIsSaving(false)
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

  const homeTeam = teams.find(t => String(t.id) === String(selectedHomeTeam))
  const awayTeam = teams.find(t => String(t.id) === String(selectedAwayTeam))

  if (isLoading) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>{t('loading')}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {isSaving && (
        <div className="saving-overlay">
          <div className="saving-message">
            <h2>{t('saving')}</h2>
            <p style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {t('elapsed', { seconds: savingSeconds })}
            </p>
          </div>
        </div>
      )}
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
          <h2>{t('addTeamSection')}</h2>
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
            <h2>{t('addGameSection')}</h2>
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
        title={t('deleteAllGamesTitle')}
        message={t('deleteAllGamesMessage', { count: games.length })}
      />
      
      <MissingTeamModal
        isOpen={showMissingTeamModal}
        onClose={handleCancelMissingTeams}
        onConfirm={handleConfirmMissingTeams}
        missingTeams={missingTeams}
      />
      
      <DeleteTeamModal
        isOpen={showDeleteTeamModal}
        onClose={cancelDeleteTeam}
        onConfirm={() => teamToDelete && confirmDeleteTeam(teamToDelete.id)}
        team={teamToDelete}
        relatedGames={relatedGamesToDelete}
        teams={teams}
      />
      </main>
    </div>
  )
}

export default App
