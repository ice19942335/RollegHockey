import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import '../App.css'
import Header from '../components/Header'
import { useLanguage } from '../i18n/LanguageContext'
import TeamForm from '../components/TeamForm'
import TeamList from '../components/TeamList'
import TournamentRoundGenerator from '../components/TournamentRoundGenerator'
import GameForm from '../components/GameForm'
import GamesList from '../components/GamesList'
import StandingsTable from '../components/StandingsTable'
import Scoreboard from '../components/Scoreboard'
import ConfirmModal from '../components/ConfirmModal'
import MissingTeamModal from '../components/MissingTeamModal'
import DeleteTeamModal from '../components/DeleteTeamModal'
import { loadDataFromSheets, saveDataToSheets, loadTournamentsList } from '../utils/googleSheets'
import { calculateStandings } from '../utils/calculateStats'

function TournamentView() {
  const { id: tournamentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language } = useLanguage()
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
  const [showDeleteAllTeamsModal, setShowDeleteAllTeamsModal] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState(null)
  const [relatedGamesToDelete, setRelatedGamesToDelete] = useState([])
  const [missingTeams, setMissingTeams] = useState([])
  const [pendingGameData, setPendingGameData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savingSeconds, setSavingSeconds] = useState(0)
  const savingIntervalRef = useRef(null)
  const savingTimeoutRef = useRef(null)
  const isInitialLoadRef = useRef(true)
  const previousDataRef = useRef({ teams: [], games: [] })
  const hasLoadedRef = useRef(false)
  const isAddingGameRef = useRef(false)
  const [tournamentNotFound, setTournamentNotFound] = useState(false)
  const [tournamentName, setTournamentName] = useState('')
  const [tournamentDescription, setTournamentDescription] = useState('')
  
  // Функция загрузки данных из Google Sheets для конкретного турнира
  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const data = await loadDataFromSheets(tournamentId)
      if (data.teams.length > 0 || data.games.length > 0) {
        setTeams(data.teams)
        setGames(data.games)
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(data.teams)),
          games: JSON.parse(JSON.stringify(data.games))
        }
        setTournamentNotFound(false)
      } else {
        // Если данных нет, возможно турнир не существует
        // Но не устанавливаем tournamentNotFound сразу, может быть это новый турнир
        setTournamentNotFound(false)
      }
      return data
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      setTournamentNotFound(true)
      return { teams: [], games: [] }
    } finally {
      if (showLoading) {
        setIsLoading(false)
        isInitialLoadRef.current = false
      }
    }
  }
  
  // Загрузка данных при старте
  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    loadData(true)
    
    // Получаем название и описание турнира из state навигации (если есть)
    const tournamentNameFromState = location.state?.tournamentName
    const tournamentDescriptionFromState = location.state?.tournamentDescription
    
    if (tournamentNameFromState) {
      setTournamentName(tournamentNameFromState)
    }
    
    if (tournamentDescriptionFromState) {
      setTournamentDescription(tournamentDescriptionFromState)
    }
    
    // Если название или описание не переданы через state, загружаем через API (fallback)
    if (!tournamentNameFromState || !tournamentDescriptionFromState) {
      const loadTournamentData = async () => {
        try {
          const tournaments = await loadTournamentsList()
          const tournament = tournaments.find(t => t.id === tournamentId)
          if (tournament) {
            if (!tournamentNameFromState && tournament.name) {
              setTournamentName(tournament.name)
            }
            if (!tournamentDescriptionFromState && tournament.description) {
              setTournamentDescription(tournament.description)
            }
          }
        } catch (error) {
          console.error('Ошибка загрузки данных турнира:', error)
        }
      }
      
      loadTournamentData()
    }
  }, [tournamentId, location.state])
  
  // Счетчик секунд при сохранении
  useEffect(() => {
    if (savingIntervalRef.current) {
      clearInterval(savingIntervalRef.current)
      savingIntervalRef.current = null
    }
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current)
      savingTimeoutRef.current = null
    }
    
    if (isSaving) {
      setSavingSeconds(0)
      savingIntervalRef.current = setInterval(() => {
        setSavingSeconds(prev => prev + 1)
      }, 1000)
    } else {
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
  
  // Автосохранение при изменении teams или games
  useEffect(() => {
    if (isLoading || isInitialLoadRef.current) return
    if (isAddingGameRef.current) return
    
    const currentDataStr = JSON.stringify({ teams, games })
    const previousDataStr = JSON.stringify(previousDataRef.current)
    
    if (currentDataStr === previousDataStr) return
    
    previousDataRef.current = {
      teams: JSON.parse(JSON.stringify(teams)),
      games: JSON.parse(JSON.stringify(games))
    }
    
    const saveData = async () => {
      setIsSaving(true)
      try {
        const standings = calculateStandings(teams, games)
        await saveDataToSheets(teams, games, standings, tournamentId)
      } catch (error) {
        console.error('Ошибка сохранения данных:', error)
      } finally {
        setIsSaving(false)
      }
    }
    
    saveData()
  }, [teams, games, isLoading, tournamentId])

  const addTeam = () => {
    if (newTeamName.trim() && !teams.find(t => t.name === newTeamName.trim())) {
      setTeams([...teams, {
        id: String(Date.now()),
        name: newTeamName.trim(),
        logo: newTeamLogo.trim() || '🏒',
        color: newTeamColor || '#1e3c72'
      }])
      setNewTeamName('')
      setNewTeamLogo('🏒')
      setNewTeamColor('#1e3c72')
    }
  }

  const handleGeneratingStart = () => {
    // Блокируем приложение в начале генерации
    isAddingGameRef.current = true
    setIsSaving(true)
  }

  const handleGenerateTeams = async (generatedTeams) => {
    console.log('handleGenerateTeams вызван с:', generatedTeams)
    
    if (!generatedTeams || generatedTeams.length === 0) {
      console.warn('Нет команд для добавления')
      setIsSaving(false)
      isAddingGameRef.current = false
      return
    }

    // Блокировка уже установлена в handleGeneratingStart
    // Убедимся что она активна
    if (!isSaving) {
      isAddingGameRef.current = true
      setIsSaving(true)
    }

    try {
      // Фильтруем команды, исключая дубликаты
      const existingNames = teams.map(t => t.name.toLowerCase().trim())
      const uniqueTeams = generatedTeams.filter(team => 
        !existingNames.includes(team.name.toLowerCase().trim())
      )

      console.log('Уникальные команды для добавления:', uniqueTeams)

      if (uniqueTeams.length > 0) {
        const updatedTeams = [...teams, ...uniqueTeams]
        setTeams(updatedTeams)
        console.log('Команды добавлены в состояние')

        // Обновляем previousDataRef
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(updatedTeams)),
          games: JSON.parse(JSON.stringify(games))
        }

        // Сохраняем в Google Sheets
        const standings = calculateStandings(updatedTeams, games)
        await saveDataToSheets(updatedTeams, games, standings, tournamentId)
        console.log('Команды сохранены в Google Sheets')
      } else {
        console.warn('Все команды уже существуют')
      }
    } catch (error) {
      console.error('Ошибка при сохранении сгенерированных команд:', error)
    } finally {
      setIsSaving(false)
      // Сбрасываем флаг после небольшой задержки
      setTimeout(() => {
        isAddingGameRef.current = false
      }, 100)
    }
  }

  const deleteTeam = (id) => {
    const team = teams.find(t => String(t.id) === String(id))
    if (!team) return
    
    const relatedGames = games.filter(g => 
      String(g.homeTeamId) === String(id) || String(g.awayTeamId) === String(id)
    )
    
    if (relatedGames.length > 0) {
      setTeamToDelete(team)
      setRelatedGamesToDelete(relatedGames)
      setShowDeleteTeamModal(true)
    } else {
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
      
      isAddingGameRef.current = true
      setIsSaving(true)
      
      try {
        const freshData = await loadData(false)
        
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
        
        if (missingTeamsList.length > 0) {
          setIsSaving(false)
          
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
          return
        }
        
        const homeScoreInt = parseInt(homeScore)
        const awayScoreInt = parseInt(awayScore)
        
        const currentGames = freshData.games.length > 0 ? freshData.games : games
        
        let newGameId
        do {
          newGameId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        } while (currentGames.some(game => game.id === newGameId))
        
        const newGame = {
          id: newGameId,
          homeTeamId: String(selectedHomeTeam),
          awayTeamId: String(selectedAwayTeam),
          homeScore: homeScoreInt,
          awayScore: awayScoreInt,
          gameType: gameType,
          date: new Date().toLocaleDateString('ru-RU')
        }
        
        const updatedGames = [...currentGames, newGame]
        
        setGames(updatedGames)
        if (freshData.teams.length > 0) {
          setTeams(currentTeams)
        }
        
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(currentTeams)),
          games: JSON.parse(JSON.stringify(updatedGames))
        }
        
        const standings = calculateStandings(currentTeams, updatedGames)
        await saveDataToSheets(currentTeams, updatedGames, standings, tournamentId)
        
        setSelectedHomeTeam('')
        setSelectedAwayTeam('')
        setHomeScore('0')
        setAwayScore('0')
        setGameType('regular')
      } catch (error) {
        console.error('Ошибка при синхронизации перед добавлением игры:', error)
        const homeScoreInt = parseInt(homeScore)
        const awayScoreInt = parseInt(awayScore)
        
        let newGameId
        do {
          newGameId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        } while (games.some(game => game.id === newGameId))
        
        const newGame = {
          id: newGameId,
          homeTeamId: String(selectedHomeTeam),
          awayTeamId: String(selectedAwayTeam),
          homeScore: homeScoreInt,
          awayScore: awayScoreInt,
          gameType: gameType,
          date: new Date().toLocaleDateString('ru-RU')
        }
        
        const updatedGames = [...games, newGame]
        setGames(updatedGames)
        
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(teams)),
          games: JSON.parse(JSON.stringify(updatedGames))
        }
        
        try {
          const standings = calculateStandings(teams, updatedGames)
          await saveDataToSheets(teams, updatedGames, standings, tournamentId)
        } catch (saveError) {
          console.error('Ошибка сохранения данных:', saveError)
        }
        
        setSelectedHomeTeam('')
        setSelectedAwayTeam('')
        setHomeScore('0')
        setAwayScore('0')
        setGameType('regular')
      } finally {
        isAddingGameRef.current = false
        setIsSaving(false)
      }
    }
  }
  
  const handleConfirmMissingTeams = async () => {
    if (!pendingGameData) return
    
    setIsSaving(true)
    setShowMissingTeamModal(false)
    
    try {
      const updatedTeams = [...pendingGameData.currentTeams]
      
      for (const missingTeam of missingTeams) {
        const existingTeam = updatedTeams.find(t => String(t.id) === String(missingTeam.id))
        if (!existingTeam) {
          const newTeam = {
            id: String(missingTeam.id),
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
      
      let newGameId
      do {
        newGameId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      } while (currentGames.some(game => game.id === newGameId))
      
      const newGame = {
        id: newGameId,
        homeTeamId: pendingGameData.homeTeamId,
        awayTeamId: pendingGameData.awayTeamId,
        homeScore: pendingGameData.homeScore,
        awayScore: pendingGameData.awayScore,
        gameType: pendingGameData.gameType,
        date: new Date().toLocaleDateString('ru-RU')
      }
      
      const updatedGames = [...currentGames, newGame]
      
      setTeams(updatedTeams)
      setGames(updatedGames)
      
      previousDataRef.current = {
        teams: JSON.parse(JSON.stringify(updatedTeams)),
        games: JSON.parse(JSON.stringify(updatedGames))
      }
      
      const standings = calculateStandings(updatedTeams, updatedGames)
      await saveDataToSheets(updatedTeams, updatedGames, standings, tournamentId)
      
      setSelectedHomeTeam('')
      setSelectedAwayTeam('')
      setHomeScore('0')
      setAwayScore('0')
      setGameType('regular')
      
      setPendingGameData(null)
      setMissingTeams([])
    } catch (error) {
      console.error('Ошибка при создании команд и сохранении игры:', error)
    } finally {
      setIsSaving(false)
      isAddingGameRef.current = false
    }
  }
  
  const handleCancelMissingTeams = () => {
    setShowMissingTeamModal(false)
    setPendingGameData(null)
    setMissingTeams([])
    isAddingGameRef.current = false
    setIsSaving(false)
  }

  // Обработчик генерации игр из TournamentRoundGenerator
  const handleGamesGenerated = async (newGames) => {
    try {
      // Загружаем свежие данные
      const freshData = await loadData(false)
      const currentGames = freshData.games.length > 0 ? freshData.games : games
      
      // Объединяем существующие игры с новыми
      const updatedGames = [...currentGames, ...newGames]
      
      // Обновляем состояние
      setGames(updatedGames)
      if (freshData.teams.length > 0) {
        setTeams(freshData.teams)
      }
      
      // Обновляем previousDataRef
      previousDataRef.current = {
        teams: JSON.parse(JSON.stringify(freshData.teams.length > 0 ? freshData.teams : teams)),
        games: JSON.parse(JSON.stringify(updatedGames))
      }
      
      // Сохраняем в Google Sheets
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSheets(currentTeams, updatedGames, standings, tournamentId)
    } catch (error) {
      console.error('Ошибка при сохранении сгенерированных игр:', error)
      throw error
    }
  }

  // Обработчик утверждения pending игры
  const handleApproveGame = async (gameId) => {
    setIsSaving(true)
    try {
      // Загружаем свежие данные
      const freshData = await loadData(false)
      const currentGames = freshData.games.length > 0 ? freshData.games : games
      
      // Находим игру и меняем флаг pending на false
      const updatedGames = currentGames.map(game => {
        if (game.id === gameId) {
          return { ...game, pending: false }
        }
        return game
      })
      
      // Обновляем состояние
      setGames(updatedGames)
      if (freshData.teams.length > 0) {
        setTeams(freshData.teams)
      }
      
      // Обновляем previousDataRef
      previousDataRef.current = {
        teams: JSON.parse(JSON.stringify(freshData.teams.length > 0 ? freshData.teams : teams)),
        games: JSON.parse(JSON.stringify(updatedGames))
      }
      
      // Сохраняем в Google Sheets
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSheets(currentTeams, updatedGames, standings, tournamentId)
    } catch (error) {
      console.error('Ошибка при утверждении игры:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Обработчик удаления одной pending игры
  const handleDeletePendingGame = async (gameId) => {
    setIsSaving(true) // Блокируем приложение
    try {
      // Загружаем свежие данные
      const freshData = await loadData(false)
      const currentGames = freshData.games.length > 0 ? freshData.games : games

      // Удаляем игру
      const updatedGames = currentGames.filter(game => game.id !== gameId)

      // Обновляем состояние
      setGames(updatedGames)
      if (freshData.teams.length > 0) {
        setTeams(freshData.teams)
      }

      // Обновляем previousDataRef
      previousDataRef.current = {
        teams: JSON.parse(JSON.stringify(freshData.teams.length > 0 ? freshData.teams : teams)),
        games: JSON.parse(JSON.stringify(updatedGames))
      }

      // Сохраняем в Google Sheets
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSheets(currentTeams, updatedGames, standings, tournamentId)
    } catch (error) {
      console.error('Ошибка при удалении pending игры:', error)
    } finally {
      setIsSaving(false) // Снимаем блокировку
    }
  }

  // Обработчик удаления всех pending игр
  const handleDeleteAllPendingGames = async () => {
    setIsSaving(true) // Блокируем приложение
    try {
      // Загружаем свежие данные
      const freshData = await loadData(false)
      const currentGames = freshData.games.length > 0 ? freshData.games : games

      // Удаляем все pending игры
      const updatedGames = currentGames.filter(game => !game.pending || game.pending === false)

      // Обновляем состояние
      setGames(updatedGames)
      if (freshData.teams.length > 0) {
        setTeams(freshData.teams)
      }

      // Обновляем previousDataRef
      previousDataRef.current = {
        teams: JSON.parse(JSON.stringify(freshData.teams.length > 0 ? freshData.teams : teams)),
        games: JSON.parse(JSON.stringify(updatedGames))
      }

      // Сохраняем в Google Sheets
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSheets(currentTeams, updatedGames, standings, tournamentId)
    } catch (error) {
      console.error('Ошибка при удалении всех pending игр:', error)
    } finally {
      setIsSaving(false) // Снимаем блокировку
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

  const handleDeleteAllTeams = () => {
    setShowDeleteAllTeamsModal(true)
  }

  const confirmDeleteAllTeams = async () => {
    setIsSaving(true)
    setShowDeleteAllTeamsModal(false)
    
    try {
      // Удаляем все команды и игры
      setTeams([])
      setGames([])
      
      // Обновляем previousDataRef
      previousDataRef.current = {
        teams: [],
        games: []
      }
      
      // Сохраняем в Google Sheets (пустые массивы)
      const standings = []
      await saveDataToSheets([], [], standings, tournamentId)
      console.log('Все команды и игры удалены')
    } catch (error) {
      console.error('Ошибка при удалении всех команд:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const cancelDeleteAllTeams = () => {
    setShowDeleteAllTeamsModal(false)
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

  if (tournamentNotFound) {
    return (
      <div className="app">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>{t('tournamentNotFound')}</h2>
          <p>{t('tournamentNotFoundMessage')}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            {t('backToTournaments')}
          </button>
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
              {t('elapsed').replace('{seconds}', savingSeconds)}
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
        {tournamentName && (
          <section className="section tournament-title-section">
            <h1 className="tournament-title">{tournamentName}</h1>
            {tournamentDescription && (
              <p className="tournament-description">{tournamentDescription}</p>
            )}
          </section>
        )}
        
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
            onGenerateTeams={handleGenerateTeams}
            onGeneratingStart={handleGeneratingStart}
            existingTeams={teams}
            language={language}
          />
          <TeamList 
            teams={teams} 
            onDeleteTeam={deleteTeam}
            onUpdateTeamName={updateTeamName}
            onDeleteAllTeams={handleDeleteAllTeams}
          />
        </section>

        <section className="section">
          <TournamentRoundGenerator 
            teams={teams} 
            tournamentId={tournamentId}
            onGamesGenerated={handleGamesGenerated}
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

        {/* Фильтруем только активные игры (не pending) для турнирной таблицы */}
        {(() => {
          const activeGames = games.filter(g => !g.pending || g.pending === false)
          return <StandingsTable teams={teams} games={activeGames} />
        })()}

        {/* Секция для pending games */}
        {(() => {
          const pendingGames = games.filter(g => g.pending === true)
          if (pendingGames.length === 0) return null
          
          return (
            <section className="section">
              <div className="pending-games-header">
                <h2>{t('pendingGames')}</h2>
                {pendingGames.length > 0 && (
                  <button
                    className="btn-delete-all-pending-games"
                    onClick={handleDeleteAllPendingGames}
                    title={t('deleteAllPendingGames')}
                  >
                    {t('deleteAllPendingGames')}
                  </button>
                )}
              </div>
              <div className="pending-games-list">
                {pendingGames.map(game => {
                  const homeTeam = teams.find(t => String(t.id) === String(game.homeTeamId))
                  const awayTeam = teams.find(t => String(t.id) === String(game.awayTeamId))
                  
                  if (!homeTeam || !awayTeam) return null
                  
                  return (
                    <div key={game.id} className="pending-game-item">
                      <div className="pending-game-info">
                        <span className="pending-game-teams">
                          {homeTeam.name} vs {awayTeam.name}
                        </span>
                        <span className="pending-game-score">
                          {game.homeScore} : {game.awayScore}
                        </span>
                        {game.gameType === 'shootout' && (
                          <span className="pending-game-type">({t('gameTypeShootout')})</span>
                        )}
                      </div>
                      <div className="pending-game-actions">
                        <button
                          className="btn-primary approve-game-btn"
                          onClick={() => handleApproveGame(game.id)}
                        >
                          {t('approveGame')}
                        </button>
                        <button
                          className="btn-delete-pending-game"
                          onClick={() => handleDeletePendingGame(game.id)}
                          title={t('deletePendingGame')}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })()}

        <GamesList 
          games={games.filter(g => !g.pending || g.pending === false)} 
          teams={teams} 
          onDeleteGame={deleteGame}
          onDeleteAllGames={handleDeleteAllGames}
        />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={cancelDeleteAllGames}
        onConfirm={confirmDeleteAllGames}
        title={t('deleteAllGamesTitle')}
        message={t('deleteAllGamesMessage').replace('{count}', games.length)}
      />

      <ConfirmModal
        isOpen={showDeleteAllTeamsModal}
        onClose={cancelDeleteAllTeams}
        onConfirm={confirmDeleteAllTeams}
        title={t('deleteAllTeamsTitle')}
        message={t('deleteAllTeamsMessage').replace('{teamsCount}', teams.length).replace('{gamesCount}', games.length)}
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

export default TournamentView

