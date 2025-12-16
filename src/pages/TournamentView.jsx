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
import Notification from '../components/Notification'
import { loadDataFromSupabase, saveDataToSupabase, loadTournamentsList } from '../utils/supabase'
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
  const [pendingScoreboardGame, setPendingScoreboardGame] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showMissingTeamModal, setShowMissingTeamModal] = useState(false)
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false)
  const [showDeleteAllTeamsModal, setShowDeleteAllTeamsModal] = useState(false)
  const [showDeletePendingGameModal, setShowDeletePendingGameModal] = useState(false)
  const [pendingGameToDelete, setPendingGameToDelete] = useState(null)
  const [showDeleteGameModal, setShowDeleteGameModal] = useState(false)
  const [gameToDelete, setGameToDelete] = useState(null)
  const [showApproveGameModal, setShowApproveGameModal] = useState(false)
  const [pendingGameToApprove, setPendingGameToApprove] = useState(null)
  const [teamToDelete, setTeamToDelete] = useState(null)
  const [relatedGamesToDelete, setRelatedGamesToDelete] = useState([])
  const [missingTeams, setMissingTeams] = useState([])
  const [pendingGameData, setPendingGameData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  // Локальные состояния загрузки для разных операций
  const [isAddingTeam, setIsAddingTeam] = useState(false)
  const [isAddingGame, setIsAddingGame] = useState(false)
  const [isGeneratingTeams, setIsGeneratingTeams] = useState(false)
  const [isDeletingGame, setIsDeletingGame] = useState({})
  const [isDeletingTeam, setIsDeletingTeam] = useState({})
  const [isApprovingGame, setIsApprovingGame] = useState({})
  const [isDeletingPendingGame, setIsDeletingPendingGame] = useState({})
  const [isDeletingAllGames, setIsDeletingAllGames] = useState(false)
  const [isDeletingAllTeams, setIsDeletingAllTeams] = useState(false)
  const [isDeletingAllPendingGames, setIsDeletingAllPendingGames] = useState(false)
  // Уведомления
  const [notification, setNotification] = useState(null)
  // Состояние для сворачивания секции добавления команды
  const [isAddTeamSectionExpanded, setIsAddTeamSectionExpanded] = useState(true)
  const [isRoundGeneratorExpanded, setIsRoundGeneratorExpanded] = useState(true)
  const [isAddGameSectionExpanded, setIsAddGameSectionExpanded] = useState(true)
  const hasSetInitialCollapseRef = useRef(false)
  const isInitialLoadRef = useRef(true)
  const previousDataRef = useRef({ teams: [], games: [] })
  const hasLoadedRef = useRef(false)
  const isAddingGameRef = useRef(false)
  const isUpdatingScoreRef = useRef(false)
  const [tournamentNotFound, setTournamentNotFound] = useState(false)
  const [tournamentName, setTournamentName] = useState('')
  const [tournamentDescription, setTournamentDescription] = useState('')
  
  // Функция загрузки данных из Supabase для конкретного турнира
  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const data = await loadDataFromSupabase(tournamentId)
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
  
  // Автоматически сворачиваем секцию добавления команды при первой загрузке, если команды уже есть
  useEffect(() => {
    if (!isLoading && !hasSetInitialCollapseRef.current) {
      hasSetInitialCollapseRef.current = true
      if (teams.length > 0) {
        setIsAddTeamSectionExpanded(false)
      } else {
        setIsAddTeamSectionExpanded(true)
      }
    }
  }, [isLoading, teams.length])

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
  
  
  // Функция для показа уведомлений
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
  }

  // Автосохранение при изменении teams или games (без UI индикации)
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
      try {
        const standings = calculateStandings(teams, games)
        await saveDataToSupabase(teams, games, standings, tournamentId)
      } catch (error) {
        console.error('Ошибка сохранения данных:', error)
      }
    }
    
    saveData()
  }, [teams, games, isLoading, tournamentId])

  const addTeam = async () => {
    if (newTeamName.trim() && !teams.find(t => t.name === newTeamName.trim())) {
      setIsAddingTeam(true)
      
      try {
        const newTeam = {
          id: String(Date.now()),
          name: newTeamName.trim(),
          logo: newTeamLogo.trim() || '🏒',
          color: newTeamColor || '#1e3c72'
        }
        const updatedTeams = [...teams, newTeam]
        setTeams(updatedTeams)
        
        // Обновляем previousDataRef для автосохранения
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(updatedTeams)),
          games: JSON.parse(JSON.stringify(games))
        }
        
        // Явно сохраняем в Supabase
        const standings = calculateStandings(updatedTeams, games)
        await saveDataToSupabase(updatedTeams, games, standings, tournamentId)
        showNotification('Команда добавлена ✓', 'success')
        
        setNewTeamName('')
        setNewTeamLogo('🏒')
        setNewTeamColor('#1e3c72')
      } catch (error) {
        console.error('Ошибка сохранения команды:', error)
        showNotification('Ошибка сохранения команды', 'error')
      } finally {
        setIsAddingTeam(false)
      }
    }
  }

  const handleGeneratingStart = () => {
    // Устанавливаем состояние загрузки для генерации
    isAddingGameRef.current = true
    setIsGeneratingTeams(true)
  }

  const handleGenerateTeams = async (generatedTeams) => {
    if (!generatedTeams || generatedTeams.length === 0) {
      setIsGeneratingTeams(false)
      isAddingGameRef.current = false
      return
    }

    try {
      // Фильтруем команды, исключая дубликаты
      const existingNames = teams.map(t => t.name.toLowerCase().trim())
      const uniqueTeams = generatedTeams.filter(team => 
        !existingNames.includes(team.name.toLowerCase().trim())
      )

      if (uniqueTeams.length > 0) {
        const updatedTeams = [...teams, ...uniqueTeams]
        setTeams(updatedTeams)

        // Обновляем previousDataRef
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(updatedTeams)),
          games: JSON.parse(JSON.stringify(games))
        }

        // Сохраняем в Supabase
        const standings = calculateStandings(updatedTeams, games)
        await saveDataToSupabase(updatedTeams, games, standings, tournamentId)
        showNotification(`Добавлено команд: ${uniqueTeams.length} ✓`, 'success')
      } else {
        showNotification('Все команды уже существуют', 'error')
      }
    } catch (error) {
      console.error('Ошибка при сохранении сгенерированных команд:', error)
      showNotification('Ошибка сохранения команд', 'error')
    } finally {
      setIsGeneratingTeams(false)
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
  
  const confirmDeleteTeam = async (id) => {
    if (!id) return
    
    setIsDeletingTeam({ [id]: true })
    setShowDeleteTeamModal(false)
    
    try {
      const updatedTeams = teams.filter(t => String(t.id) !== String(id))
      const updatedGames = games.filter(g => String(g.homeTeamId) !== String(id) && String(g.awayTeamId) !== String(id))
      
      setTeams(updatedTeams)
      setGames(updatedGames)
      
      // Обновляем previousDataRef
      previousDataRef.current = {
        teams: JSON.parse(JSON.stringify(updatedTeams)),
        games: JSON.parse(JSON.stringify(updatedGames))
      }
      
      // Сохраняем в Supabase
      const standings = calculateStandings(updatedTeams, updatedGames)
      await saveDataToSupabase(updatedTeams, updatedGames, standings, tournamentId)
      showNotification('Команда удалена ✓', 'success')
    } catch (error) {
      console.error('Ошибка при удалении команды:', error)
      showNotification('Ошибка удаления команды', 'error')
    } finally {
      setTeamToDelete(null)
      setRelatedGamesToDelete([])
      setIsDeletingTeam({ [id]: false })
    }
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
      setIsAddingGame(true)
      
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
          setIsAddingGame(false)
          
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
          date: new Date().toLocaleString('ru-RU', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })
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
        await saveDataToSupabase(currentTeams, updatedGames, standings, tournamentId)
        showNotification('Игра добавлена ✓', 'success')
        
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
          date: new Date().toLocaleString('ru-RU', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })
        }
        
        const updatedGames = [...games, newGame]
        setGames(updatedGames)
        
        previousDataRef.current = {
          teams: JSON.parse(JSON.stringify(teams)),
          games: JSON.parse(JSON.stringify(updatedGames))
        }
        
        try {
          const standings = calculateStandings(teams, updatedGames)
          await saveDataToSupabase(teams, updatedGames, standings, tournamentId)
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
        setIsAddingGame(false)
      }
    }
  }
  
  const handleConfirmMissingTeams = async () => {
    if (!pendingGameData) return
    
    setIsAddingGame(true)
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
      await saveDataToSupabase(updatedTeams, updatedGames, standings, tournamentId)
      showNotification('Игра добавлена ✓', 'success')
      
      setSelectedHomeTeam('')
      setSelectedAwayTeam('')
      setHomeScore('0')
      setAwayScore('0')
      setGameType('regular')
      
      setPendingGameData(null)
      setMissingTeams([])
    } catch (error) {
      console.error('Ошибка при создании команд и сохранении игры:', error)
      showNotification('Ошибка сохранения игры', 'error')
    } finally {
      setIsAddingGame(false)
      isAddingGameRef.current = false
    }
  }
  
  const handleCancelMissingTeams = () => {
    setShowMissingTeamModal(false)
    setPendingGameData(null)
    setMissingTeams([])
    isAddingGameRef.current = false
    setIsAddingGame(false)
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
      
      // Сохраняем в Supabase
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSupabase(currentTeams, updatedGames, standings, tournamentId)
    } catch (error) {
      console.error('Ошибка при сохранении сгенерированных игр:', error)
      throw error
    }
  }

  // Обработчик открытия модального окна утверждения pending игры
  const handleApproveGameClick = (game) => {
    setPendingGameToApprove(game)
    setShowApproveGameModal(true)
  }

  // Обработчик утверждения pending игры
  const handleApproveGame = async (gameId) => {
    // Закрываем модальное окно подтверждения сразу после подтверждения
    setShowApproveGameModal(false)
    setPendingGameToApprove(null)
    
    setIsApprovingGame({ [gameId]: true })
    try {
      // Сначала находим игру в локальном состоянии, чтобы сохранить актуальный счет
      const localGame = games.find(g => g.id === gameId)
      if (!localGame) {
        console.error('Игра не найдена в локальном состоянии')
        setIsSaving(false)
        return
      }
      
      // Загружаем свежие данные для синхронизации
      const freshData = await loadData(false)
      const currentGames = freshData.games.length > 0 ? freshData.games : games
      
      // Находим игру и обновляем ее, используя актуальные данные из локального состояния
      // Это гарантирует, что счет будет сохранен правильно
      const updatedGames = currentGames.map(game => {
        if (game.id === gameId) {
          // Используем данные из локального состояния (актуальный счет)
          return { 
            ...localGame, 
            pending: false 
          }
        }
        return game
      })
      
      // Если игры нет в freshData, добавляем ее из локального состояния
      if (!currentGames.find(g => g.id === gameId)) {
        updatedGames.push({ ...localGame, pending: false })
      }
      
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
      
      // Сохраняем в Supabase
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSupabase(currentTeams, updatedGames, standings, tournamentId)
    } catch (error) {
      console.error('Ошибка при утверждении игры:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Обработчик открытия модального окна удаления pending игры
  const handleDeletePendingGameClick = (game) => {
    setPendingGameToDelete(game)
    setShowDeletePendingGameModal(true)
  }

  // Обработчик удаления одной pending игры
  const handleDeletePendingGame = async (gameId) => {
    // Закрываем модальное окно подтверждения сразу после подтверждения
    setShowDeletePendingGameModal(false)
    setPendingGameToDelete(null)
    
    setIsDeletingPendingGame(prev => ({ ...prev, [gameId]: true }))
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

      // Сохраняем в Supabase
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSupabase(currentTeams, updatedGames, standings, tournamentId)
      
      showNotification(t('deletePendingGame') + ' ✓', 'success')
    } catch (error) {
      console.error('Ошибка при удалении pending игры:', error)
      showNotification('Ошибка удаления игры', 'error')
    } finally {
      setIsDeletingPendingGame(prev => {
        const newState = { ...prev }
        delete newState[gameId]
        return newState
      })
    }
  }

  // Отмена удаления pending игры
  const cancelDeletePendingGame = () => {
    setShowDeletePendingGameModal(false)
    setPendingGameToDelete(null)
  }

  // Обработчик удаления всех pending игр
  const handleDeleteAllPendingGames = async () => {
    setIsDeletingAllPendingGames(true)
    try {
      // Загружаем свежие данные
      const freshData = await loadData(false)
      const currentGames = freshData.games.length > 0 ? freshData.games : games

      // Удаляем все pending игры
      const updatedGames = currentGames.filter(game => !game.pending || game.pending === false)
      const deletedCount = currentGames.length - updatedGames.length

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

      // Сохраняем в Supabase
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSupabase(currentTeams, updatedGames, standings, tournamentId)
      
      if (deletedCount > 0) {
        showNotification(`${t('deletedPendingGames', { count: deletedCount })} ✓`, 'success')
      } else {
        showNotification(t('noPendingGamesToDelete'), 'error')
      }
    } catch (error) {
      console.error('Ошибка при удалении всех pending игр:', error)
      showNotification('Ошибка удаления игр', 'error')
    } finally {
      setIsDeletingAllPendingGames(false)
    }
  }

  // Обработчик изменения счета pending игры
  const handleUpdatePendingGameScore = (gameId, teamType, delta) => {
    // Устанавливаем флаг, чтобы предотвратить автосохранение
    isUpdatingScoreRef.current = true
    
    // Обновляем счет только локально, без синхронизации с Supabase
    const updatedGames = games.map(game => {
      if (game.id === gameId) {
        const newHomeScore = teamType === 'home' 
          ? Math.max(0, (game.homeScore || 0) + delta)
          : (game.homeScore || 0)
        const newAwayScore = teamType === 'away'
          ? Math.max(0, (game.awayScore || 0) + delta)
          : (game.awayScore || 0)
        return { ...game, homeScore: newHomeScore, awayScore: newAwayScore }
      }
      return game
    })
    setGames(updatedGames)
    
    // Обновляем previousDataRef, чтобы предотвратить автосохранение
    previousDataRef.current = {
      teams: JSON.parse(JSON.stringify(teams)),
      games: JSON.parse(JSON.stringify(updatedGames))
    }
    
    // Сбрасываем флаг после небольшой задержки
    setTimeout(() => {
      isUpdatingScoreRef.current = false
    }, 100)
  }

  const handleDeleteGameClick = (gameId) => {
    setGameToDelete(gameId)
    setShowDeleteGameModal(true)
  }

  const cancelDeleteGame = () => {
    setShowDeleteGameModal(false)
    setGameToDelete(null)
  }

  const confirmDeleteGame = async () => {
    if (!gameToDelete) return
    
    setShowDeleteGameModal(false)
    const gameId = gameToDelete
    setGameToDelete(null)
    
    setIsDeletingGame(prev => ({ ...prev, [gameId]: true }))
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

      // Сохраняем в Supabase
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSupabase(currentTeams, updatedGames, standings, tournamentId)
      
      showNotification(t('deletePendingGame') + ' ✓', 'success')
    } catch (error) {
      console.error('Ошибка при удалении игры:', error)
      showNotification('Ошибка удаления игры', 'error')
    } finally {
      setIsDeletingGame(prev => {
        const newState = { ...prev }
        delete newState[gameId]
        return newState
      })
    }
  }

  const handleDeleteAllGames = () => {
    setShowConfirmModal(true)
  }

  const confirmDeleteAllGames = async () => {
    setShowConfirmModal(false)
    setIsDeletingAllGames(true)
    try {
      // Загружаем свежие данные из базы данных
      const freshData = await loadData(false)
      // Всегда используем freshData.games, чтобы получить все игры из базы данных
      const currentGames = freshData.games || []
      
      // Удаляем только игры, где pending == false (оставляем pending игры)
      const updatedGames = currentGames.filter(game => game.pending === true)
      const deletedCount = currentGames.length - updatedGames.length

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

      // Сохраняем в Supabase (оставляем только pending игры)
      const currentTeams = freshData.teams.length > 0 ? freshData.teams : teams
      const standings = calculateStandings(currentTeams, updatedGames)
      await saveDataToSupabase(currentTeams, updatedGames, standings, tournamentId)
      
      if (deletedCount > 0) {
        showNotification(`Удалено игр: ${deletedCount} ✓`, 'success')
      } else {
        showNotification('Нет игр для удаления', 'error')
      }
    } catch (error) {
      console.error('Ошибка при удалении всех игр:', error)
      showNotification('Ошибка удаления игр', 'error')
    } finally {
      setIsDeletingAllGames(false)
    }
  }

  const cancelDeleteAllGames = () => {
    setShowConfirmModal(false)
  }

  const handleDeleteAllTeams = () => {
    setShowDeleteAllTeamsModal(true)
  }

  const confirmDeleteAllTeams = async () => {
    setIsDeletingAllTeams(true)
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
      
      // Сохраняем в Supabase (пустые массивы)
      const standings = []
      await saveDataToSupabase([], [], standings, tournamentId)
      showNotification('Все команды удалены ✓', 'success')
    } catch (error) {
      console.error('Ошибка при удалении всех команд:', error)
      showNotification('Ошибка удаления команд', 'error')
    } finally {
      setIsDeletingAllTeams(false)
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

  const openPendingGameScoreboard = (game) => {
    setPendingScoreboardGame(game)
    setShowScoreboard(true)
  }

  const closeScoreboard = () => {
    setShowScoreboard(false)
    setPendingScoreboardGame(null)
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
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {showScoreboard && (() => {
        // Если открыто табло для pending игры, используем данные игры
        if (pendingScoreboardGame) {
          // Получаем актуальную игру из состояния games, чтобы счет всегда был актуальным
          const currentGame = games.find(g => g.id === pendingScoreboardGame.id)
          const gameToDisplay = currentGame || pendingScoreboardGame
          
          const pendingHomeTeam = teams.find(t => String(t.id) === String(gameToDisplay.homeTeamId))
          const pendingAwayTeam = teams.find(t => String(t.id) === String(gameToDisplay.awayTeamId))
          
          if (!pendingHomeTeam || !pendingAwayTeam) {
            return null
          }

          return (
            <Scoreboard
              homeTeam={pendingHomeTeam}
              awayTeam={pendingAwayTeam}
              homeScore={gameToDisplay.homeScore || 0}
              awayScore={gameToDisplay.awayScore || 0}
              gameType={gameToDisplay.gameType || 'regular'}
              onClose={closeScoreboard}
              onIncrementHomeScore={() => handleUpdatePendingGameScore(pendingScoreboardGame.id, 'home', 1)}
              onDecrementHomeScore={() => handleUpdatePendingGameScore(pendingScoreboardGame.id, 'home', -1)}
              onIncrementAwayScore={() => handleUpdatePendingGameScore(pendingScoreboardGame.id, 'away', 1)}
              onDecrementAwayScore={() => handleUpdatePendingGameScore(pendingScoreboardGame.id, 'away', -1)}
            />
          )
        }

        // Иначе используем данные из формы
        return (
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
        )
      })()}
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

        {/* Фильтруем только активные игры (не pending) для турнирной таблицы */}
        {(() => {
          const activeGames = games.filter(g => !g.pending || g.pending === false)
          return <StandingsTable teams={teams} games={activeGames} />
        })()}
        
        <section className="section">
          <div 
            className="section-header-collapsible"
            onClick={() => setIsAddTeamSectionExpanded(!isAddTeamSectionExpanded)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <h2>{t('addTeamSection')}</h2>
            <span className={`collapse-icon ${isAddTeamSectionExpanded ? 'expanded' : 'collapsed'}`}>
              ▼
            </span>
          </div>
          <div className={`section-collapsible-content ${isAddTeamSectionExpanded ? 'expanded' : 'collapsed'}`}>
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
              isAddingTeam={isAddingTeam}
              isGeneratingTeams={isGeneratingTeams}
            />
          </div>
          <TeamList 
            teams={teams} 
            onDeleteTeam={deleteTeam}
            onUpdateTeamName={updateTeamName}
            onDeleteAllTeams={handleDeleteAllTeams}
          />
        </section>

        <section className="section">
          <div 
            className="section-header-collapsible"
            onClick={() => setIsRoundGeneratorExpanded(!isRoundGeneratorExpanded)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <h2>{t('tournamentRoundGenerator')}</h2>
            <span className={`collapse-icon ${isRoundGeneratorExpanded ? 'expanded' : 'collapsed'}`}>
              ▼
            </span>
          </div>
          <div className={`section-collapsible-content ${isRoundGeneratorExpanded ? 'expanded' : 'collapsed'}`}>
            <TournamentRoundGenerator 
              teams={teams} 
              tournamentId={tournamentId}
              onGamesGenerated={handleGamesGenerated}
              onNotification={showNotification}
            />
          </div>
        </section>

        {teams.length >= 2 && (
          <section className="section">
            <div 
              className="section-header-collapsible"
              onClick={() => setIsAddGameSectionExpanded(!isAddGameSectionExpanded)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <h2>{t('addGameSection')}</h2>
              <span className={`collapse-icon ${isAddGameSectionExpanded ? 'expanded' : 'collapsed'}`}>
                ▼
              </span>
            </div>
            <div className={`section-collapsible-content ${isAddGameSectionExpanded ? 'expanded' : 'collapsed'}`}>
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
                isAddingGame={isAddingGame}
              />
            </div>
          </section>
        )}

        {/* Секция для pending games */}
        {(() => {
          const pendingGames = games.filter(g => g.pending === true)
          if (pendingGames.length === 0) return null
          
          return (
            <section className="section">
              <div className="pending-games-header">
                <h2>{t('pendingGames')} ({pendingGames.length})</h2>
                {pendingGames.length > 0 && (
                  <button
                    className={`btn-delete-all-pending-games ${isDeletingAllPendingGames ? 'btn-loading' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteAllPendingGames()
                    }}
                    title={t('deleteAllPendingGames')}
                    disabled={isDeletingAllPendingGames}
                  >
                    {isDeletingAllPendingGames && <span className="btn-spinner"></span>}
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
                        <div className="pending-game-main">
                          <div className="pending-game-teams-wrapper">
                            <span className="pending-game-teams">
                              {homeTeam.name} vs {awayTeam.name}
                            </span>
                            {game.gameType === 'shootout' && (
                              <span className="pending-game-type">({t('gameTypeShootout')})</span>
                            )}
                          </div>
                          <div className="pending-game-score-controls">
                            <div className="score-control-group">
                              <button
                                className="btn-score-decrease"
                                onClick={() => handleUpdatePendingGameScore(game.id, 'home', -1)}
                                title={t('decreaseScore')}
                              >
                                −
                              </button>
                              <button
                                className="btn-score-increase"
                                onClick={() => handleUpdatePendingGameScore(game.id, 'home', 1)}
                                title={t('increaseScore')}
                              >
                                +
                              </button>
                              <span className="pending-game-score">
                                {game.homeScore || 0}
                              </span>
                            </div>
                            <span className="score-separator">:</span>
                            <div className="score-control-group">
                            <span className="pending-game-score">
                                {game.awayScore || 0}
                              </span>
                              <button
                                className="btn-score-decrease"
                                onClick={() => handleUpdatePendingGameScore(game.id, 'away', -1)}
                                title={t('decreaseScore')}
                              >
                                −
                              </button>
                              <button
                                className="btn-score-increase"
                                onClick={() => handleUpdatePendingGameScore(game.id, 'away', 1)}
                                title={t('increaseScore')}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pending-game-actions">
                        <button
                          className="btn-primary open-scoreboard-btn"
                          onClick={() => openPendingGameScoreboard(game)}
                          title={t('openScoreboard')}
                        >
                          {t('openScoreboard')}
                        </button>
                        <button
                          className="btn-primary approve-game-btn"
                          onClick={() => handleApproveGameClick(game)}
                        >
                          {t('approveGame')}
                        </button>
                        <button
                          className={`btn-delete-pending-game ${isDeletingPendingGame[game.id] ? 'btn-loading' : ''}`}
                          onClick={() => handleDeletePendingGameClick(game)}
                          title={t('deletePendingGame')}
                          disabled={isDeletingPendingGame[game.id]}
                        >
                          {isDeletingPendingGame[game.id] && <span className="btn-spinner"></span>}
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
          onDeleteGame={handleDeleteGameClick}
          onDeleteAllGames={handleDeleteAllGames}
          isDeletingAllGames={isDeletingAllGames}
        />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={cancelDeleteAllGames}
        onConfirm={confirmDeleteAllGames}
        title={t('deleteAllGamesTitle')}
        message={t('deleteAllGamesMessage', { count: games.length })}
      />

      <ConfirmModal
        isOpen={showDeleteAllTeamsModal}
        onClose={cancelDeleteAllTeams}
        onConfirm={confirmDeleteAllTeams}
        title={t('deleteAllTeamsTitle')}
        message={t('deleteAllTeamsMessage').replace('{teamsCount}', teams.length).replace('{gamesCount}', games.length)}
      />

      <ConfirmModal
        isOpen={showDeletePendingGameModal}
        onClose={cancelDeletePendingGame}
        onConfirm={() => pendingGameToDelete && handleDeletePendingGame(pendingGameToDelete.id)}
        title={t('deletePendingGameTitle')}
        message={t('deletePendingGameMessage')}
      />

      <ConfirmModal
        isOpen={showDeleteGameModal}
        onClose={cancelDeleteGame}
        onConfirm={confirmDeleteGame}
        title={t('deletePendingGameTitle')}
        message={t('deletePendingGameMessage')}
      />

      <ConfirmModal
        isOpen={showApproveGameModal}
        onClose={() => {
          setShowApproveGameModal(false)
          setPendingGameToApprove(null)
        }}
        onConfirm={() => pendingGameToApprove && handleApproveGame(pendingGameToApprove.id)}
        title={t('approveGameTitle')}
        message={t('approveGameMessage')}
        confirmButtonStyle="success"
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
        onConfirm={() => {
          if (teamToDelete && teamToDelete.id) {
            confirmDeleteTeam(teamToDelete.id)
          }
        }}
        team={teamToDelete}
        relatedGames={relatedGamesToDelete}
        teams={teams}
      />
      </main>
    </div>
  )
}

export default TournamentView

