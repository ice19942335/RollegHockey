export const calculateTeamStats = (teamId, games) => {
  const teamGames = games.filter(g => 
    g.homeTeamId === teamId || g.awayTeamId === teamId
  )

  let gamesPlayed = teamGames.length
  let wins = 0
  let winsOT = 0
  let lossesOT = 0
  let losses = 0
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
      if (game.gameType === 'regular') {
        wins++
        points += 3
      } else {
        winsOT++
        points += 2
      }
    } else if (teamScore < opponentScore) {
      if (game.gameType === 'regular') {
        losses++
        points += 0
      } else {
        lossesOT++
        points += 1
      }
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

