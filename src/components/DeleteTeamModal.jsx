function DeleteTeamModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  team, 
  relatedGames,
  teams
}) {
  if (!isOpen || !team) return null

  const getTeamName = (teamId) => {
    const team = teams.find(t => String(t.id) === String(teamId))
    return team ? team.name : `Команда ${teamId}`
  }

  const gameTypeLabels = {
    regular: 'Основное время',
    shootout: 'Буллиты'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Удалить команду "{team.name}"?</h3>
        {relatedGames.length > 0 ? (
          <>
            <p>
              Эта команда участвует в {relatedGames.length} {relatedGames.length === 1 ? 'игре' : 'играх'}. 
              При удалении команды все связанные игры также будут удалены.
            </p>
            <div style={{ 
              maxHeight: '300px', 
              overflowY: 'auto', 
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '8px'
            }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Связанные игры:</h4>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                margin: 0,
                textAlign: 'left'
              }}>
                {relatedGames.map((game, index) => {
                  const homeTeam = teams.find(t => String(t.id) === String(game.homeTeamId))
                  const awayTeam = teams.find(t => String(t.id) === String(game.awayTeamId))
                  const homeTeamName = homeTeam ? homeTeam.name : getTeamName(game.homeTeamId)
                  const awayTeamName = awayTeam ? awayTeam.name : getTeamName(game.awayTeamId)
                  
                  return (
                    <li key={game.id || index} style={{ 
                      padding: '0.5rem',
                      margin: '0.5rem 0',
                      background: 'white',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}>
                      <strong>{homeTeamName}</strong> {game.homeScore} - {game.awayScore} <strong>{awayTeamName}</strong>
                      <br />
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>
                        {gameTypeLabels[game.gameType] || 'Основное время'} • {game.date}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
            <p style={{ marginTop: '1rem', fontWeight: 'bold', color: '#c62828' }}>
              Вы уверены, что хотите удалить команду и все связанные игры?
            </p>
          </>
        ) : (
          <p>Вы уверены, что хотите удалить эту команду?</p>
        )}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Отмена
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteTeamModal

