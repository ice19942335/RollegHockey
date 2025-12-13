export const calculateTeamStats = (teamId, games) => {
  // Преобразуем teamId в строку для единообразия
  const teamIdStr = String(teamId)
  const teamGames = games.filter(g => 
    String(g.homeTeamId) === teamIdStr || String(g.awayTeamId) === teamIdStr
  )

  let gamesPlayed = teamGames.length
  let wins = 0
  let winsOT = 0
  let lossesOT = 0
  let losses = 0
  let draws = 0
  let goalsFor = 0
  let goalsAgainst = 0
  let points = 0

  teamGames.forEach(game => {
    const isHome = game.homeTeamId === teamId
    const teamScore = isHome ? game.homeScore : game.awayScore
    const opponentScore = isHome ? game.awayScore : game.homeScore

    goalsFor += teamScore
    goalsAgainst += opponentScore

    if (teamScore > opponentScore) {
      // Победа
      if (game.gameType === 'regular') {
        wins++
        points += 3
      } else {
        // Победа в буллитах
        winsOT++
        points += 2
      }
    } else if (teamScore < opponentScore) {
      // Поражение - 0 очков (все поражения дают 0 очков)
      if (game.gameType === 'regular') {
        losses++
      } else {
        lossesOT++
      }
      // points не изменяется (0 очков)
    } else {
      // Ничья - 1 очко в любом случае
      draws++
      points += 1
    }
  })

  const goalDifference = goalsFor - goalsAgainst
  const pointsPercentage = gamesPlayed > 0 ? (points / (gamesPlayed * 3) * 100).toFixed(1) : 0

  return {
    gamesPlayed,
    wins,
    winsOT,
    lossesOT,
    losses,
    draws,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
    pointsPercentage
  }
}

export const calculateStandings = (teams, games) => {
  return teams.map(team => ({
    ...team,
    ...calculateTeamStats(team.id, games)
  })).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })
}

