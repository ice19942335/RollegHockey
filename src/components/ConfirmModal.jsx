import { useLanguage } from '../i18n/LanguageContext'

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  const { t } = useLanguage()
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal


