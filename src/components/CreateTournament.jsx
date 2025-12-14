import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { createTournament } from '../utils/googleSheets'
import CreatingTournamentModal from './CreatingTournamentModal'
import '../App.css'

function CreateTournament() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [creationError, setCreationError] = useState(null)

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

  const handleCancel = () => {
    navigate('/')
  }

  const handleCloseModal = () => {
    setCreationError(null)
    setIsCreating(false)
  }

  return (
    <div className="create-tournament-container">
      <h1>{t('createTournamentTitle')}</h1>
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
            onClick={handleCancel}
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

      <CreatingTournamentModal
        isOpen={isCreating}
        error={creationError}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default CreateTournament

