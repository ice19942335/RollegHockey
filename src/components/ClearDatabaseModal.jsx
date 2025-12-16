import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { getDatabaseStats } from '../utils/supabase'

function ClearDatabaseModal({ 
  isOpen, 
  onClose, 
  onConfirm
}) {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ tournaments: 0, teams: 0, games: 0 })
  
  useEffect(() => {
    if (isOpen) {
      loadStats()
    } else {
      setIsLoading(true)
      setStats({ tournaments: 0, teams: 0, games: 0 })
    }
  }, [isOpen])
  
  const loadStats = async () => {
    setIsLoading(true)
    try {
      const databaseStats = await getDatabaseStats()
      setStats(databaseStats)
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  const totalItems = stats.tournaments + stats.teams + stats.games
  
  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          <>
            <h3>{t('clearDatabaseTitle')}</h3>
            <div className="spinner" style={{ margin: '2rem auto' }}></div>
            <p>{t('loading')}</p>
          </>
        ) : totalItems === 0 ? (
          <>
            <h3>{t('clearDatabaseTitle')}</h3>
            <p>{t('clearDatabaseEmpty')}</p>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={onClose}>
                {t('closeButton')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{t('clearDatabaseTitle')}</h3>
            
            {/* Информация о данных */}
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                <strong>{t('tournamentsListTitle')}:</strong> {stats.tournaments}
              </div>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                <strong>{t('teamsList')}:</strong> {stats.teams}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                <strong>{t('gamesTitle')}:</strong> {stats.games}
              </div>
            </div>
            
            {/* Предупреждение */}
            <p style={{ 
              marginTop: '1.5rem', 
              fontWeight: 'bold', 
              color: '#c62828',
              fontSize: '1rem'
            }}>
              {t('clearDatabaseWarning')}
            </p>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={onClose}>
                {t('cancel')}
              </button>
              <button className="btn-confirm btn-danger" onClick={onConfirm}>
                {t('menuClearDatabase')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default ClearDatabaseModal
