import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { loadTournamentsList } from '../utils/googleSheets'
import '../App.css'

function DeleteTournamentModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tournament 
}) {
  const { t, language } = useLanguage()
  const [isSyncing, setIsSyncing] = useState(false)
  const [tournamentExists, setTournamentExists] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    if (isOpen && tournament) {
      checkTournamentExists()
    } else {
      // Сброс состояния при закрытии
      setIsChecking(false)
      setIsSyncing(false)
      setTournamentExists(true)
    }
  }, [isOpen, tournament])
  
  const checkTournamentExists = async () => {
    if (!tournament || !tournament.id) {
      setIsChecking(false)
      return
    }
    
    setIsChecking(true)
    setIsSyncing(true)
    
    try {
      const tournaments = await loadTournamentsList()
      const exists = tournaments.some(t => String(t.id) === String(tournament.id))
      setTournamentExists(exists)
    } catch (error) {
      console.error('Ошибка при проверке существования турнира:', error)
      // В случае ошибки предполагаем, что турнир существует, чтобы пользователь мог попробовать удалить
      setTournamentExists(true)
    } finally {
      setIsSyncing(false)
      setIsChecking(false)
    }
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
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
  
  if (!isOpen || !tournament) return null
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {isChecking ? (
          <>
            <h3>{t('deleteTournamentSyncing')}</h3>
            <div className="spinner" style={{ margin: '2rem auto' }}></div>
            <p>{t('deleteTournamentSyncing')}</p>
          </>
        ) : !tournamentExists ? (
          <>
            <h3>{t('deleteTournamentError')}</h3>
            <p>{t('deleteTournamentAlreadyDeleted')}</p>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={onClose}>
                {t('closeButton')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{t('deleteTournamentConfirm')}</h3>
            
            {/* Информация о турнире */}
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{tournament.name}</h4>
              
              {(tournament.startDate || tournament.endDate) && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  {tournament.startDate && (
                    <div>
                      <strong>{t('startDate')}:</strong> {formatDate(tournament.startDate)}
                    </div>
                  )}
                  {tournament.endDate && (
                    <div>
                      <strong>{t('endDate')}:</strong> {formatDate(tournament.endDate)}
                    </div>
                  )}
                </div>
              )}
              
              {tournament.teams && tournament.teams.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                  <strong>{t('teams')}:</strong> {tournament.teams.length}
                </div>
              )}
            </div>
            
            {/* Предупреждение */}
            <p style={{ 
              marginTop: '1.5rem', 
              fontWeight: 'bold', 
              color: '#c62828',
              fontSize: '1rem'
            }}>
              {t('deleteTournamentWarning')}
            </p>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={onClose}>
                {t('cancel')}
              </button>
              <button className="btn-confirm btn-danger" onClick={onConfirm}>
                {t('deleteTournament')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DeleteTournamentModal

