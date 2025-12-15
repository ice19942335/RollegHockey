import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { createTournament } from '../utils/googleSheets'
import CreatingTournamentModal from './CreatingTournamentModal'
import '../App.css'

function CreateTournamentModal({ isOpen, onClose }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState(null)

  // Сброс формы при закрытии модального окна
  const handleClose = () => {
    setName('')
    setStartDate('')
    setEndDate('')
    setDescription('')
    setError('')
    setCreationError(null)
    setIsCreating(false)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Валидация
    if (!name.trim()) {
      setError(t('tournamentNameRequired'))
      return
    }

    setIsCreating(true)
    setCreationError(null)

    try {
      const result = await createTournament({
        name: name.trim(),
        startDate,
        endDate,
        description: description.trim()
      })

      if (result.success) {
        // Закрываем модальное окно
        handleClose()
        // Перенаправляем на страницу турнира
        navigate(`/t/${result.tournamentId}`)
      } else {
        setCreationError(result.error || t('creatingTournamentErrorDetails'))
      }
    } catch (err) {
      setCreationError(err.message || t('creatingTournamentErrorDetails'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleCloseModal = () => {
    setCreationError(null)
    setIsCreating(false)
  }

  if (!isOpen) return null

  const modalContent = (
    <>
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content create-tournament-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={handleClose} title={t('closeButton')}>
            ✕
          </button>
          <h2>{t('createTournamentTitle')}</h2>
          <form className="create-tournament-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tournament-name">{t('tournamentName')} *</label>
              <input
                id="tournament-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('tournamentNamePlaceholder')}
                disabled={isCreating}
                required
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="start-date">{t('startDate')}</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isCreating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end-date">{t('endDate')}</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isCreating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">{t('description')}</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                disabled={isCreating}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleClose}
                disabled={isCreating}
              >
                {t('cancelButton')}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreating || !name.trim()}
              >
                {t('createButton')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <CreatingTournamentModal
        isOpen={isCreating}
        error={creationError}
        onClose={handleCloseModal}
      />
    </>
  )

  return createPortal(modalContent, document.body)
}

export default CreateTournamentModal

