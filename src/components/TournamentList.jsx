import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { loadTournamentsList, loadDataFromSheets, deleteTournament } from '../utils/googleSheets'
import { IS_DEV_MODE } from '../config/googleSheets'
import DeleteTournamentModal from './DeleteTournamentModal'
import DeletingTournamentModal from './DeletingTournamentModal'
import '../App.css'

function TournamentList() {
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState([])
  const [tournamentsWithTeams, setTournamentsWithTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingSeconds, setLoadingSeconds] = useState(0)
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletionError, setDeletionError] = useState(null)
  const [tournamentToDelete, setTournamentToDelete] = useState(null)
  const hasLoadedRef = useRef(false)
  const loadingIntervalRef = useRef(null)

  useEffect(() => {
    // Защита от двойного вызова в React StrictMode
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    loadTournaments()
  }, [])

  useEffect(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current)
      loadingIntervalRef.current = null
    }
    
    if (loading) {
      setLoadingSeconds(0)
      loadingIntervalRef.current = setInterval(() => {
        setLoadingSeconds(prev => prev + 1)
      }, 1000)
    } else {
      setLoadingSeconds(0)
    }
    
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
    }
  }, [loading])

  const loadTournaments = async () => {
    setLoading(true)
    try {
      const data = await loadTournamentsList()
      setTournaments(data)
      
      // Загружаем команды для каждого турнира
      const tournamentsWithTeamsData = await Promise.all(
        data.map(async (tournament) => {
          try {
            const tournamentData = await loadDataFromSheets(tournament.id)
            return {
              ...tournament,
              teams: tournamentData.teams || []
            }
          } catch (error) {
            console.error(`Ошибка загрузки команд для турнира ${tournament.id}:`, error)
            return {
              ...tournament,
              teams: []
            }
          }
        })
      )
      
      setTournamentsWithTeams(tournamentsWithTeamsData)
    } catch (error) {
      console.error('Ошибка загрузки турниров:', error)
      setTournaments([])
      setTournamentsWithTeams([])
    } finally {
      setLoading(false)
    }
  }

  const toggleDescription = (tournamentId, e) => {
    e.stopPropagation() // Предотвращаем переход на страницу турнира
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tournamentId)) {
        newSet.delete(tournamentId)
      } else {
        newSet.add(tournamentId)
      }
      return newSet
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      // Используем текущий язык из контекста для форматирования даты
      const locale = language === 'lv' ? 'lv-LV' : 'ru-RU'
      return date.toLocaleDateString(locale, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch (error) {
      return dateString
    }
  }

  const truncateDescription = (description, maxLength = 50) => {
    if (!description) return ''
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength) + '...'
  }

  const handleCreateTournament = () => {
    navigate('/create')
  }

  const handleTournamentClick = (tournamentId, tournamentName) => {
    navigate(`/t/${tournamentId}`, { state: { tournamentName } })
  }

  const handleDeleteClick = (e, tournament) => {
    e.stopPropagation() // Предотвращаем переход на страницу турнира
    setTournamentToDelete(tournament)
    setShowDeleteModal(true)
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setTournamentToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!tournamentToDelete) return
    
    // Закрываем модальное окно подтверждения
    setShowDeleteModal(false)
    
    // Открываем модальное окно блокировки
    setIsDeleting(true)
    setDeletionError(null)
    
    try {
      // Синхронизация перед удалением
      const tournaments = await loadTournamentsList()
      
      // Проверка существования
      const tournamentExists = tournaments.some(t => String(t.id) === String(tournamentToDelete.id))
      
      if (!tournamentExists) {
        // Турнир уже был удален
        setIsDeleting(false)
        alert(t('deleteTournamentAlreadyDeleted'))
        // Обновляем список турниров
        await loadTournaments()
        setTournamentToDelete(null)
        return
      }
      
      // Вызываем удаление
      const result = await deleteTournament(tournamentToDelete.id)
      
      if (result.success) {
        // Успешное удаление
        setIsDeleting(false)
        setTournamentToDelete(null)
        // Обновляем список турниров
        await loadTournaments()
      } else {
        // Ошибка при удалении
        setDeletionError(result.error || t('deleteTournamentErrorDetails'))
      }
    } catch (error) {
      console.error('Ошибка при удалении турнира:', error)
      setDeletionError(error.message || t('deleteTournamentErrorDetails'))
    }
  }

  const handleCloseDeletingModal = () => {
    setIsDeleting(false)
    setDeletionError(null)
    setTournamentToDelete(null)
  }

  if (loading) {
    return (
      <div className="tournament-list-container">
        <h1>{t('tournamentsListTitle')}</h1>
        <div className="loading-tournaments">
          <p>{t('loadingTournaments')}</p>
          <p className="loading-time">{t('elapsed', { seconds: loadingSeconds })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="tournament-list-container">
      <h1>{t('tournamentsListTitle')}</h1>
      <button className="btn-primary create-tournament-btn" onClick={handleCreateTournament}>
        {t('createTournamentButton')}
      </button>
      
      {tournaments.length === 0 ? (
        <div className="no-tournaments">
          <p>{t('noTournaments')}</p>
        </div>
      ) : (
        <div className="tournaments-grid">
          {tournamentsWithTeams.map((tournament) => {
            const isDescriptionExpanded = expandedDescriptions.has(tournament.id)
            const description = tournament.description || ''
            const displayDescription = isDescriptionExpanded 
              ? description 
              : truncateDescription(description, 50)
            
            return (
              <div
                key={tournament.id}
                className="tournament-card"
                onClick={() => handleTournamentClick(tournament.id, tournament.name)}
              >
                <button
                  className="tournament-delete-btn"
                  onClick={(e) => handleDeleteClick(e, tournament)}
                  title={t('deleteTournament')}
                >
                  🗑️
                </button>
                <h2 className="tournament-card-title">{tournament.name}</h2>
                
                {IS_DEV_MODE && tournament.id && (
                  <div className="tournament-card-id">
                    ID: {tournament.id}
                  </div>
                )}
                
                {(tournament.startDate || tournament.endDate) && (
                  <div className="tournament-card-dates">
                    {tournament.startDate && (
                      <div className="tournament-date">
                        <span className="tournament-date-label">{t('startDate')}:</span>
                        <span className="tournament-date-value">{formatDate(tournament.startDate)}</span>
                      </div>
                    )}
                    {tournament.endDate && (
                      <div className="tournament-date">
                        <span className="tournament-date-label">{t('endDate')}:</span>
                        <span className="tournament-date-value">{formatDate(tournament.endDate)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {tournament.teams && tournament.teams.length > 0 && (
                  <div className="tournament-card-teams">
                    <div className="tournament-teams-label">{t('teams')}:</div>
                    <div className="tournament-teams-list">
                      {tournament.teams.map((team, index) => (
                        <span key={team.id} className="tournament-team-item">
                          {team.logo} {team.name}
                          {index < tournament.teams.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {description && (
                  <div className="tournament-card-description">
                    <div className="tournament-description-label">{t('descriptionLabel')}:</div>
                    <span 
                      className={`tournament-description-text ${isDescriptionExpanded ? 'expanded' : ''}`}
                      onClick={(e) => toggleDescription(tournament.id, e)}
                    >
                      {displayDescription}
                    </span>
                    {description.length > 50 && (
                      <button
                        className="tournament-description-toggle"
                        onClick={(e) => toggleDescription(tournament.id, e)}
                      >
                        {isDescriptionExpanded ? t('showLess') : t('showMore')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      <DeleteTournamentModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        tournament={tournamentToDelete}
      />
      
      <DeletingTournamentModal
        isOpen={isDeleting}
        error={deletionError}
        onClose={handleCloseDeletingModal}
      />
    </div>
  )
}

export default TournamentList

