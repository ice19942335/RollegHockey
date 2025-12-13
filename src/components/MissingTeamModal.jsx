function MissingTeamModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  missingTeams 
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Команды не найдены</h3>
        <p>
          После синхронизации с Google Sheets обнаружено, что следующие команды отсутствуют в данных:
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
          Вы можете создать эти команды заново и сохранить их вместе с игрой, либо отменить операцию.
        </p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Отменить
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Создать команды и сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

export default MissingTeamModal

