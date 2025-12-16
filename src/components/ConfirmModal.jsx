import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageContext'

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmButtonStyle }) {
  const { t } = useLanguage()
  if (!isOpen) return null

  const confirmButtonClass = confirmButtonStyle === 'success' 
    ? 'btn-confirm btn-success' 
    : 'btn-confirm'

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className={confirmButtonClass} onClick={onConfirm}>
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default ConfirmModal


