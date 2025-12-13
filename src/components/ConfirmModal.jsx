function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal


