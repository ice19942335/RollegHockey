import { useLanguage } from '../i18n/LanguageContext'

function MissingTeamModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  missingTeams 
}) {
  const { t } = useLanguage()
  
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{t('missingTeamsTitle')}</h3>
        <p>
          {t('missingTeamsMessage')}
        </p>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: '1rem 0',
          textAlign: 'left'
        }}>
          {missingTeams.map((team, index) => (
            <li key={index} style={{ 
              padding: '0.5rem', 
              margin: '0.5rem 0',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px'
            }}>
              <strong>{team.name}</strong> (ID: {team.id})
            </li>
          ))}
        </ul>
        <p>
          {t('missingTeamsAction')}
        </p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            {t('cancelAction')}
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            {t('createTeamsAndSave')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MissingTeamModal

