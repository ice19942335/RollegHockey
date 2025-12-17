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
import {
  loadDataFromSupabase,
  loadTournamentsList,
  subscribeToTournamentRealtime,
  upsertTeamInSupabase,
  upsertTeamsInSupabase,
  updateTeamNameInSupabase,
  deleteTeamInSupabase,
  deleteAllTeamsInSupabase,
  upsertGameInSupabase,
  upsertGamesInSupabase,
  deleteGameInSupabase,
  deleteGamesByPendingInSupabase,
  deleteNonPendingGamesInSupabase,
  updateGamePendingInSupabase,
  updateGameScoreDeltaInSupabase
} from '../utils/supabase'

function TournamentView() {
  const { id: tournamentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language } = useLanguage()
  const [teams, setTeams] = useState([])
  const [games, setGames] = useState([])
  const gamesSnapshotRef = useRef([])
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamLogo, setNewTeamLogo] = useState('🏒')
  const [newTeamColor, setNewTeamColor] = useState('#1e3c72')
  const [selectedHomeTeam, setSelectedHomeTeam] = useState('')
  const [selectedAwayTeam, setSelectedAwayTeam] = useState('')
  const [homeScore, setHomeScore] = useState('0')
  const [awayScore, setAwayScore] = useState('0')
  const [gameType, setGameType] = useState('regular')
  const [selectedRound, setSelectedRound] = useState('')
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [pendingScoreboardGame, setPendingScoreboardGame] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showMissingTeamModal, setShowMissingTeamModal] = useState(false)
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false)
  const [showDeleteAllTeamsModal, setShowDeleteAllTeamsModal] = useState(false)
  const [showDeletePendingGameModal, setShowDeletePendingGameModal] = useState(false)
  const [showDeleteAllPendingGamesModal, setShowDeleteAllPendingGamesModal] = useState(false)
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
  const hasLoadedRef = useRef(false)
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

  // Keep latest games snapshot for fast sequential clicks (before React re-render)
  useEffect(() => {
    gamesSnapshotRef.current = games
  }, [games])

  // Realtime: автоматически подтягиваем изменения игр/команд турнира
  useEffect(() => {
    if (!tournamentId) return

    const normalizeTeam = (team) => {
      if (!team) return null
      return {
        id: String(team.id),
        name: String(team.name || ''),
        logo: String(team.logo || '🏒'),
        color: String(team.color || '#1e3c72')
      }
    }

    const normalizeGame = (game) => {
      if (!game) return null
      return {
        id: String(game.id),
        homeTeamId: String(game.homeTeamId),
        awayTeamId: String(game.awayTeamId),
        homeScore: parseInt(game.homeScore) || 0,
        awayScore: parseInt(game.awayScore) || 0,
        gameType: String(game.gameType || 'regular'),
        date: String(game.date || ''),
        pending: game.pending === true,
        round:
          game.round === null || game.round === undefined || game.round === ''
            ? null
            : parseInt(game.round, 10) || null
      }
    }

    const upsertById = (items, item) => {
      const idx = items.findIndex(x => String(x.id) === String(item.id))
      if (idx === -1) return [...items, item]
      const next = [...items]
      next[idx] = { ...next[idx], ...item }
      return next
    }

    const unsubscribe = subscribeToTournamentRealtime(tournamentId, {
      onGameChange: payload => {
        const eventType = payload?.eventType
        if (eventType === 'DELETE') {
          const id = payload?.old?.id
          if (!id) return
          setGames(prev => prev.filter(g => String(g.id) !== String(id)))
          return
        }

        const game = normalizeGame(payload?.new)
        if (!game?.id) return
        setGames(prev => upsertById(prev, game))
      },
      onTeamChange: payload => {
        const eventType = payload?.eventType
        if (eventType === 'DELETE') {
          const id = payload?.old?.id
          if (!id) return
          setTeams(prev => prev.filter(t => String(t.id) !== String(id)))
          return
        }

        const team = normalizeTeam(payload?.new)
        if (!team?.id) return
        setTeams(prev => upsertById(prev, team))
      }
    })

    return () => {
      unsubscribe?.()
    }
  }, [tournamentId])

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
        // Optimistic UI update
        setTeams(prev => [...prev, newTeam])

        const { error } = await upsertTeamInSupabase(newTeam, tournamentId)
        if (error) {
          // rollback
          setTeams(prev => prev.filter(t => String(t.id) !== String(newTeam.id)))
          throw error
        }

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
    setIsGeneratingTeams(true)
  }

  const handleGenerateTeams = async (generatedTeams) => {
    if (!generatedTeams || generatedTeams.length === 0) {
      setIsGeneratingTeams(false)
      return
    }

    try {
      // Фильтруем команды, исключая дубликаты
      const existingNames = teams.map(t => t.name.toLowerCase().trim())
      const uniqueTeams = generatedTeams.filter(team => 
        !existingNames.includes(team.name.toLowerCase().trim())
      )

      if (uniqueTeams.length > 0) {
        // Optimistic UI update
        setTeams(prev => [...prev, ...uniqueTeams])

        const { error } = await upsertTeamsInSupabase(uniqueTeams, tournamentId)
        if (error) {
          // best-effort rollback
          const ids = new Set(uniqueTeams.map(t => String(t.id)))
          setTeams(prev => prev.filter(t => !ids.has(String(t.id))))
          throw error
        }

        showNotification(`Добавлено команд: ${uniqueTeams.length} ✓`, 'success')
      } else {
        showNotification('Все команды уже существуют', 'error')
      }
    } catch (error) {
      console.error('Ошибка при сохранении сгенерированных команд:', error)
      showNotification('Ошибка сохранения команд', 'error')
    } finally {
      setIsGeneratingTeams(false)
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
      const prevTeams = teams
      const prevGames = games

      // Optimistic UI update
      const updatedTeams = prevTeams.filter(t => String(t.id) !== String(id))
      const updatedGames = prevGames.filter(g => String(g.homeTeamId) !== String(id) && String(g.awayTeamId) !== String(id))
      setTeams(updatedTeams)
      setGames(updatedGames)

      const { error } = await deleteTeamInSupabase(id, tournamentId)
      if (error) {
        // rollback by reloading (best effort)
        await loadData(false)
        throw error
      }

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

  const updateTeamName = async (id, newName) => {
    const trimmed = (newName || '').trim()
    if (!trimmed) return
    if (teams.find(t => t.id !== id && t.name === trimmed)) return

    // Optimistic UI update
    setTeams(prev => prev.map(team => (team.id === id ? { ...team, name: trimmed } : team)))

    const { error } = await updateTeamNameInSupabase(id, tournamentId, trimmed)
    if (error) {
      console.error('Ошибка сохранения имени команды:', error)
      showNotification('Ошибка сохранения имени команды', 'error')
      // best-effort resync
      await loadData(false)
    }
  }

  const addGame = async () => {
    if (
      !selectedHomeTeam ||
      !selectedAwayTeam ||
      selectedHomeTeam === selectedAwayTeam ||
      homeScore === '' ||
      awayScore === '' ||
      parseInt(homeScore) < 0 ||
      parseInt(awayScore) < 0
    ) {
      return
    }

    setIsAddingGame(true)

    const roundValue =
      selectedRound === null || selectedRound === undefined || selectedRound === ''
        ? null
        : Math.max(1, parseInt(selectedRound, 10) || 0) || null

    const homeScoreInt = parseInt(homeScore) || 0
    const awayScoreInt = parseInt(awayScore) || 0

    let newGameId
    do {
      newGameId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    } while (games.some(game => game.id === newGameId))

    const newGame = {
      id: newGameId,
      homeTeamId: String(selectedHomeTeam),
      awayTeamId: String(selectedAwayTeam),
      homeScore: homeScoreInt,
      awayScore: awayScoreInt,
      gameType: gameType,
      round: roundValue,
      pending: true,
      date: new Date().toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    try {
      // Optimistic UI update
      setGames(prev => [...prev, newGame])

      const { error } = await upsertGameInSupabase(newGame, tournamentId)
      if (error) {
        // rollback
        setGames(prev => prev.filter(g => String(g.id) !== String(newGame.id)))
        throw error
      }

      showNotification('Игра добавлена ✓', 'success')

      setSelectedHomeTeam('')
      setSelectedAwayTeam('')
      setHomeScore('0')
      setAwayScore('0')
      setGameType('regular')
      setSelectedRound('')
    } catch (error) {
      console.error('Ошибка добавления игры:', error)
      showNotification('Ошибка сохранения игры', 'error')
    } finally {
      setIsAddingGame(false)
    }
  }
  
  const handleConfirmMissingTeams = async () => {
    if (!pendingGameData) return
    
    setIsAddingGame(true)
    setShowMissingTeamModal(false)
    
    try {
      // 1) Ensure missing teams exist in DB
      const teamsToUpsert = (missingTeams || []).map(mt => ({
        id: String(mt.id),
        name: mt.name,
        logo: mt.logo || '🏒',
        color: mt.color || '#1e3c72'
      }))

      if (teamsToUpsert.length > 0) {
        const { error: teamsError } = await upsertTeamsInSupabase(teamsToUpsert, tournamentId)
        if (teamsError) throw teamsError

        // Optimistic local merge (realtime will also sync)
        setTeams(prev => {
          const byId = new Map(prev.map(t => [String(t.id), t]))
          for (const t of teamsToUpsert) byId.set(String(t.id), t)
          return Array.from(byId.values())
        })
      }

      // 2) Create game
      let newGameId
      do {
        newGameId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      } while (games.some(game => game.id === newGameId))

      const newGame = {
        id: newGameId,
        homeTeamId: String(pendingGameData.homeTeamId),
        awayTeamId: String(pendingGameData.awayTeamId),
        homeScore: parseInt(pendingGameData.homeScore) || 0,
        awayScore: parseInt(pendingGameData.awayScore) || 0,
        gameType: pendingGameData.gameType || 'regular',
        round: pendingGameData.round ?? null,
        pending: true,
        date: new Date().toLocaleDateString('ru-RU')
      }

      // Optimistic UI update
      setGames(prev => [...prev, newGame])

      const { error: gameError } = await upsertGameInSupabase(newGame, tournamentId)
      if (gameError) {
        setGames(prev => prev.filter(g => String(g.id) !== String(newGameId)))
        throw gameError
      }

      showNotification('Игра добавлена ✓', 'success')
      
      setSelectedHomeTeam('')
      setSelectedAwayTeam('')
      setHomeScore('0')
      setAwayScore('0')
      setGameType('regular')
      setSelectedRound('')
      
      setPendingGameData(null)
      setMissingTeams([])
    } catch (error) {
      console.error('Ошибка при создании команд и сохранении игры:', error)
      showNotification('Ошибка сохранения игры', 'error')
    } finally {
      setIsAddingGame(false)
    }
  }
  
  const handleCancelMissingTeams = () => {
    setShowMissingTeamModal(false)
    setPendingGameData(null)
    setMissingTeams([])
    setIsAddingGame(false)
  }

  // Обработчик генерации игр из TournamentRoundGenerator
  const handleGamesGenerated = async (newGames) => {
    try {
      if (!newGames || newGames.length === 0) return

      // Optimistic UI update
      setGames(prev => [...prev, ...newGames])

      const { error } = await upsertGamesInSupabase(newGames, tournamentId)
      if (error) {
        const ids = new Set(newGames.map(g => String(g.id)))
        setGames(prev => prev.filter(g => !ids.has(String(g.id))))
        throw error
      }
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
    
    setIsApprovingGame(prev => ({ ...prev, [gameId]: true }))
    try {
      // Optimistic UI update
      setGames(prev => prev.map(g => (g.id === gameId ? { ...g, pending: false } : g)))

      const { error } = await updateGamePendingInSupabase(gameId, tournamentId, false)
      if (error) {
        // best-effort resync
        await loadData(false)
        throw error
      }

      showNotification(t('approveGame') + ' ✓', 'success')
    } catch (error) {
      console.error('Ошибка при утверждении игры:', error)
    } finally {
      setIsApprovingGame(prev => {
        const next = { ...prev }
        delete next[gameId]
        return next
      })
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
      // Optimistic UI update
      setGames(prev => prev.filter(game => game.id !== gameId))

      const { error } = await deleteGameInSupabase(gameId, tournamentId)
      if (error) {
        await loadData(false)
        throw error
      }
      
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

  // Обработчик открытия модального окна удаления всех pending игр
  const handleDeleteAllPendingGames = () => {
    setShowDeleteAllPendingGamesModal(true)
  }

  // Подтверждение удаления всех pending игр
  const confirmDeleteAllPendingGames = async () => {
    // Закрываем модальное окно подтверждения сразу после подтверждения
    setShowDeleteAllPendingGamesModal(false)
    setIsDeletingAllPendingGames(true)
    try {
      const pendingCount = games.filter(g => g.pending === true).length

      // Optimistic UI update
      setGames(prev => prev.filter(game => game.pending !== true))

      const { error } = await deleteGamesByPendingInSupabase(tournamentId, true)
      if (error) {
        await loadData(false)
        throw error
      }
      
      if (pendingCount > 0) {
        showNotification(`${t('deletedPendingGames', { count: pendingCount })} ✓`, 'success')
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

  // Отмена удаления всех pending игр
  const cancelDeleteAllPendingGames = () => {
    setShowDeleteAllPendingGamesModal(false)
  }

  // Обработчик изменения счета pending игры
  const handleUpdatePendingGameScore = async (gameId, teamType, delta) => {
    const snapshot = Array.isArray(gamesSnapshotRef.current) ? gamesSnapshotRef.current : []
    const current = snapshot.find(g => g.id === gameId)
    if (!current) return

    const expectedHomeScore = current.homeScore || 0
    const expectedAwayScore = current.awayScore || 0

    // Optimistic UI update
    const optimisticGames = snapshot.map(game => {
      if (game.id !== gameId) return game
      const nextHome =
        teamType === 'home' ? Math.max(0, (game.homeScore || 0) + delta) : (game.homeScore || 0)
      const nextAway =
        teamType === 'away' ? Math.max(0, (game.awayScore || 0) + delta) : (game.awayScore || 0)
      return { ...game, homeScore: nextHome, awayScore: nextAway }
    })
    gamesSnapshotRef.current = optimisticGames
    setGames(optimisticGames)

    const { data, error } = await updateGameScoreDeltaInSupabase({
      gameId,
      tournamentId,
      side: teamType,
      delta,
      expectedHomeScore,
      expectedAwayScore
    })

    if (error) {
      console.error('Ошибка обновления счёта:', error)
      showNotification('Ошибка обновления счёта', 'error')
      // best-effort resync
      await loadData(false)
      return
    }

    // If we got authoritative row back (especially on conflict), apply it
    if (data?.id) {
      setGames(prev => prev.map(g => (g.id === data.id ? { ...g, ...data } : g)))
    }
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
      // Optimistic UI update
      setGames(prev => prev.filter(game => game.id !== gameId))

      const { error } = await deleteGameInSupabase(gameId, tournamentId)
      if (error) {
        await loadData(false)
        throw error
      }
      
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
      const deletedCount = games.filter(g => g.pending !== true).length

      // Optimistic UI update: keep only pending games
      setGames(prev => prev.filter(game => game.pending === true))

      const { error } = await deleteNonPendingGamesInSupabase(tournamentId)
      if (error) {
        await loadData(false)
        throw error
      }
      
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
      // Optimistic UI update: Удаляем все команды и игры
      setTeams([])
      setGames([])

      const { error } = await deleteAllTeamsInSupabase(tournamentId)
      if (error) {
        await loadData(false)
        throw error
      }

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

      <main className="main pdf-export-root">
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
        
        <section className="section add-team-section">
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

        <section className="section round-generator-section">
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
          <section className="section add-game-section">
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
                round={selectedRound}
                setRound={setSelectedRound}
                maxRound={Math.max(
                  0,
                  ...games.map(g => {
                    const r =
                      g?.round === null || g?.round === undefined || g?.round === ''
                        ? 0
                        : parseInt(g.round, 10) || 0
                    return r
                  })
                )}
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

          const pendingGamesByRound = new Map()
          const pendingGamesWithoutRound = []

          for (const game of pendingGames) {
            const round =
              game?.round === null || game?.round === undefined || game?.round === ''
                ? null
                : parseInt(game.round, 10) || null

            if (!round) {
              pendingGamesWithoutRound.push(game)
              continue
            }

            if (!pendingGamesByRound.has(round)) {
              pendingGamesByRound.set(round, [])
            }
            pendingGamesByRound.get(round).push(game)
          }

          const sortedPendingRounds = Array.from(pendingGamesByRound.keys()).sort((a, b) => a - b)

          const renderPendingGame = (game) => {
            const homeTeam = teams.find(t => String(t.id) === String(game.homeTeamId))
            const awayTeam = teams.find(t => String(t.id) === String(game.awayTeamId))
            const round =
              game?.round === null || game?.round === undefined || game?.round === ''
                ? null
                : parseInt(game.round, 10) || null
            
            if (!homeTeam || !awayTeam) return null
            
            return (
              <div key={game.id} className="pending-game-item">
                <div className="pending-game-info">
                  <div className="pending-game-main">
                    <div className="pending-game-teams-wrapper">
                      {round && (
                        <span className="pending-game-round">
                          {t('roundGroupTitle', { round })}
                        </span>
                      )}
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
          }
          
          return (
            <section className="section pending-section">
              <div className="pending-games-header">
                <h2>{t('pendingGames')} ({pendingGames.length})</h2>
                {pendingGames.length > 0 && (
                  <button
                    type="button"
                    className={`btn-delete-all-pending-games ${isDeletingAllPendingGames ? 'btn-loading' : ''}`}
                    onClick={handleDeleteAllPendingGames}
                    title={t('deleteAllPendingGames')}
                    disabled={isDeletingAllPendingGames}
                  >
                    {isDeletingAllPendingGames && <span className="btn-spinner"></span>}
                    {t('deleteAllPendingGames')}
                  </button>
                )}
              </div>
              <div className="pending-games-list">
                {sortedPendingRounds.map(round => (
                  <div key={`pending-round-${round}`} className="pending-round-group">
                    <div className="pending-round-header">
                      <h3 className="pending-round-title">{t('roundGroupTitle', { round })}</h3>
                    </div>
                    <div className="pending-round-list">
                      {pendingGamesByRound.get(round).map(renderPendingGame)}
                    </div>
                  </div>
                ))}

                {pendingGamesWithoutRound.length > 0 && (
                  <div className="pending-round-group pending-round-group-no-round">
                    <div className="pending-round-header">
                      <h3 className="pending-round-title">{t('noRoundGroupTitle')}</h3>
                    </div>
                    <div className="pending-round-list">
                      {pendingGamesWithoutRound.map(renderPendingGame)}
                    </div>
                  </div>
                )}
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
      </main>

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
        isOpen={showDeleteAllPendingGamesModal}
        onClose={cancelDeleteAllPendingGames}
        onConfirm={confirmDeleteAllPendingGames}
        title={t('deleteAllPendingGamesTitle')}
        message={t('deleteAllPendingGamesMessage', { count: games.filter(g => g.pending === true).length })}
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
    </div>
  )
}

export default TournamentView

