/**
 * Генерирует игры "все против всех" для указанных команд
 * @param {Array<string|number>} teamIds - массив ID команд
 * @param {number} rounds - количество туров
 * @returns {Array<Object>} массив игр с флагом pending: true
 */
export function generateRoundRobinGames(teamIds, rounds) {
  if (!teamIds || teamIds.length < 2) {
    return []
  }

  if (!rounds || rounds < 1) {
    return []
  }

  const games = []
  
  // Генерируем все пары команд (каждая команда играет с каждой другой один раз)
  const pairs = []
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      pairs.push([teamIds[i], teamIds[j]])
    }
  }
  
  // Повторяем для каждого тура
  for (let round = 1; round <= rounds; round++) {
    pairs.forEach(([homeTeamId, awayTeamId], pairIndex) => {
      // Генерируем уникальный ID для игры
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substr(2, 9)
      const gameId = `${timestamp}-${round}-${pairIndex}-${randomStr}`
      
      games.push({
        id: gameId,
        homeTeamId: String(homeTeamId),
        awayTeamId: String(awayTeamId),
        homeScore: 0,
        awayScore: 0,
        gameType: 'regular',
        date: new Date().toLocaleDateString('ru-RU'),
        pending: true // Флаг указывает, что игра в процессе
      })
    })
  }
  
  return games
}

