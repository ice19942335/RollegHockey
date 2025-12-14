import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import '../App.css'

function DeletingTournamentModal({ isOpen, error, onClose }) {
  const { t } = useLanguage()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setElapsedSeconds(0)
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-overlay deleting-tournament-overlay">
      <div className="modal-content deleting-tournament-modal" onClick={(e) => e.stopPropagation()}>
        {error ? (
          <>
            <h3>{t('deleteTournamentError')}</h3>
            <p>{error}</p>
            <p style={{ marginTop: '1rem', fontWeight: 'bold', color: '#c62828' }}>
              {t('deleteTournamentContactAdmin')}
            </p>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={onClose}>
                {t('closeButton')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{t('deletingTournamentTitle')}</h3>
            <p>{t('deletingTournamentMessage')}</p>
            <div className="deleting-tournament-timer">
              <p>{t('elapsed').replace('{seconds}', elapsedSeconds)}</p>
            </div>
            <div className="deleting-tournament-spinner">
              <div className="spinner"></div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default DeletingTournamentModal

