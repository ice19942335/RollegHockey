import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import '../App.css'

function CreatingTournamentModal({ isOpen, error, onClose }) {
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
    <div className="modal-overlay creating-tournament-overlay">
      <div className="modal-content creating-tournament-modal" onClick={(e) => e.stopPropagation()}>
        {error ? (
          <>
            <h3>{t('creatingTournamentError')}</h3>
            <p>{t('creatingTournamentErrorDetails')}</p>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={onClose}>
                {t('closeButton')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{t('creatingTournamentTitle')}</h3>
            <p>{t('creatingTournamentMessage')}</p>
            <div className="creating-tournament-timer">
              <p>{t('elapsed').replace('{seconds}', elapsedSeconds)}</p>
            </div>
            <div className="creating-tournament-spinner">
              <div className="spinner"></div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CreatingTournamentModal

