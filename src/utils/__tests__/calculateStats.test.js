import { describe, it, expect } from 'vitest'
import { calculateTeamStats, calculateStandings } from '../calculateStats'

describe('calculateTeamStats', () => {
  it('should return zero statistics for a team with no games', () => {
    const teamId = '1'
    const games = []
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats).toEqual({
      gamesPlayed: 0,
      wins: 0,
      winsOT: 0,
      lossesOT: 0,
      losses: 0,
      draws: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      pointsPercentage: 0
    })
  })

  it('should correctly count a regular time win (3 points)', () => {
    const teamId = '1'
    const games = [{
      id: '1',
      homeTeamId: '1',
      awayTeamId: '2',
      homeScore: 3,
      awayScore: 2,
      gameType: 'regular',
      date: '01.01.2025'
    }]
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.wins).toBe(1)
    expect(stats.winsOT).toBe(0)
    expect(stats.losses).toBe(0)
    expect(stats.lossesOT).toBe(0)
    expect(stats.draws).toBe(0)
    expect(stats.points).toBe(3)
    expect(stats.goalsFor).toBe(3)
    expect(stats.goalsAgainst).toBe(2)
    expect(stats.goalDifference).toBe(1)
  })

  it('should correctly count a shootout win (2 points)', () => {
    const teamId = '1'
    const games = [{
      id: '1',
      homeTeamId: '1',
      awayTeamId: '2',
      homeScore: 3,
      awayScore: 2,
      gameType: 'shootout',
      date: '01.01.2025'
    }]
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.wins).toBe(0)
    expect(stats.winsOT).toBe(1)
    expect(stats.points).toBe(2)
  })

  it('should correctly count a regular time loss (0 points)', () => {
    const teamId = '1'
    const games = [{
      id: '1',
      homeTeamId: '1',
      awayTeamId: '2',
      homeScore: 1,
      awayScore: 3,
      gameType: 'regular',
      date: '01.01.2025'
    }]
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.wins).toBe(0)
    expect(stats.losses).toBe(1)
    expect(stats.lossesOT).toBe(0)
    expect(stats.points).toBe(0)
    expect(stats.goalsFor).toBe(1)
    expect(stats.goalsAgainst).toBe(3)
    expect(stats.goalDifference).toBe(-2)
  })

  it('should correctly count a shootout loss (0 points)', () => {
    const teamId = '1'
    const games = [{
      id: '1',
      homeTeamId: '1',
      awayTeamId: '2',
      homeScore: 1,
      awayScore: 2,
      gameType: 'shootout',
      date: '01.01.2025'
    }]
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.losses).toBe(0)
    expect(stats.lossesOT).toBe(1)
    expect(stats.points).toBe(0)
  })

  it('should correctly count a draw (1 point)', () => {
    const teamId = '1'
    const games = [{
      id: '1',
      homeTeamId: '1',
      awayTeamId: '2',
      homeScore: 2,
      awayScore: 2,
      gameType: 'regular',
      date: '01.01.2025'
    }]
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.wins).toBe(0)
    expect(stats.winsOT).toBe(0)
    expect(stats.losses).toBe(0)
    expect(stats.lossesOT).toBe(0)
    expect(stats.draws).toBe(1)
    expect(stats.points).toBe(1)
    expect(stats.goalsFor).toBe(2)
    expect(stats.goalsAgainst).toBe(2)
    expect(stats.goalDifference).toBe(0)
  })

  it('should correctly count a shootout draw (1 point)', () => {
    const teamId = '1'
    const games = [{
      id: '1',
      homeTeamId: '1',
      awayTeamId: '2',
      homeScore: 2,
      awayScore: 2,
      gameType: 'shootout',
      date: '01.01.2025'
    }]
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats.draws).toBe(1)
    expect(stats.points).toBe(1)
  })

  it('should correctly calculate statistics for an away team', () => {
    const teamId = '2'
    const games = [{
      id: '1',
      homeTeamId: '1',
      awayTeamId: '2',
      homeScore: 1,
      awayScore: 3,
      gameType: 'regular',
      date: '01.01.2025'
    }]
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.wins).toBe(1)
    expect(stats.points).toBe(3)
    expect(stats.goalsFor).toBe(3)
    expect(stats.goalsAgainst).toBe(1)
    expect(stats.goalDifference).toBe(2)
  })

  it('should correctly calculate complex statistics with multiple games', () => {
    const teamId = '1'
    const games = [
      {
        id: '1',
        homeTeamId: '1',
        awayTeamId: '2',
        homeScore: 3,
        awayScore: 2,
        gameType: 'regular',
        date: '01.01.2025'
      },
      {
        id: '2',
        homeTeamId: '3',
        awayTeamId: '1',
        homeScore: 1,
        awayScore: 4,
        gameType: 'regular',
        date: '02.01.2025'
      },
      {
        id: '3',
        homeTeamId: '1',
        awayTeamId: '4',
        homeScore: 2,
        awayScore: 2,
        gameType: 'regular',
        date: '03.01.2025'
      },
      {
        id: '4',
        homeTeamId: '1',
        awayTeamId: '5',
        homeScore: 3,
        awayScore: 1,
        gameType: 'shootout',
        date: '04.01.2025'
      },
      {
        id: '5',
        homeTeamId: '6',
        awayTeamId: '1',
        homeScore: 2,
        awayScore: 1,
        gameType: 'regular',
        date: '05.01.2025'
      }
    ]
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats.gamesPlayed).toBe(5)
    expect(stats.wins).toBe(2) // games 1 and 2
    expect(stats.winsOT).toBe(1) // game 4
    expect(stats.losses).toBe(1) // game 5
    expect(stats.draws).toBe(1) // game 3
    expect(stats.points).toBe(3 + 3 + 1 + 2 + 0) // 9 points
    expect(stats.goalsFor).toBe(3 + 4 + 2 + 3 + 1) // 13 goals
    expect(stats.goalsAgainst).toBe(2 + 1 + 2 + 1 + 2) // 8 goals
    expect(stats.goalDifference).toBe(5)
  })

  it('should correctly work with different ID types (strings and numbers)', () => {
    const teamId = 1
    const games = [{
      id: '1',
      homeTeamId: 1,
      awayTeamId: '2',
      homeScore: 3,
      awayScore: 2,
      gameType: 'regular',
      date: '01.01.2025'
    }]
    
    const stats = calculateTeamStats(teamId, games)
    
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.wins).toBe(1)
    expect(stats.points).toBe(3)
  })
})

describe('calculateStandings', () => {
  it('should return an empty array for an empty team list', () => {
    const teams = []
    const games = []
    
    const standings = calculateStandings(teams, games)
    
    expect(standings).toEqual([])
  })

  it('should correctly sort teams by points', () => {
    const teams = [
      { id: '1', name: 'Команда 1', logo: '🏒', color: '#1e3c72' },
      { id: '2', name: 'Команда 2', logo: '🥅', color: '#c62828' },
      { id: '3', name: 'Команда 3', logo: '⛸️', color: '#2e7d32' }
    ]
    
    const games = [
      {
        id: '1',
        homeTeamId: '1',
        awayTeamId: '2',
        homeScore: 3,
        awayScore: 2,
        gameType: 'regular',
        date: '01.01.2025'
      },
      {
        id: '2',
        homeTeamId: '3',
        awayTeamId: '2',
        homeScore: 1,
        awayScore: 1,
        gameType: 'regular',
        date: '02.01.2025'
      }
    ]
    
    const standings = calculateStandings(teams, games)
    
    expect(standings.length).toBe(3)
    // Team 1 should be first with 3 points
    expect(standings[0].id).toBe('1')
    expect(standings[0].points).toBe(3)
    // Teams 2 and 3 have 1 point each, order can be any
    const secondPlace = standings[1]
    const thirdPlace = standings[2]
    expect([secondPlace.id, thirdPlace.id].sort()).toEqual(['2', '3'])
    expect(secondPlace.points).toBe(1)
    expect(thirdPlace.points).toBe(1)
  })

  it('should correctly sort teams with equal points by goal difference', () => {
    const teams = [
      { id: '1', name: 'Команда 1', logo: '🏒', color: '#1e3c72' },
      { id: '2', name: 'Команда 2', logo: '🥅', color: '#c62828' }
    ]
    
    const games = [
      {
        id: '1',
        homeTeamId: '1',
        awayTeamId: '2',
        homeScore: 5,
        awayScore: 2,
        gameType: 'regular',
        date: '01.01.2025'
      },
      {
        id: '2',
        homeTeamId: '2',
        awayTeamId: '1',
        homeScore: 3,
        awayScore: 2,
        gameType: 'regular',
        date: '02.01.2025'
      }
    ]
    
    const standings = calculateStandings(teams, games)
    
    expect(standings[0].id).toBe('1') // 3 points, difference +2
    expect(standings[0].points).toBe(3)
    expect(standings[0].goalDifference).toBe(2)
    expect(standings[1].id).toBe('2') // 3 points, difference -2
    expect(standings[1].points).toBe(3)
    expect(standings[1].goalDifference).toBe(-2)
  })

  it('should correctly sort teams with equal points and goal difference by goals scored', () => {
    const teams = [
      { id: '1', name: 'Команда 1', logo: '🏒', color: '#1e3c72' },
      { id: '2', name: 'Команда 2', logo: '🥅', color: '#c62828' }
    ]
    
    const games = [
      {
        id: '1',
        homeTeamId: '1',
        awayTeamId: '2',
        homeScore: 5,
        awayScore: 3,
        gameType: 'regular',
        date: '01.01.2025'
      },
      {
        id: '2',
        homeTeamId: '2',
        awayTeamId: '1',
        homeScore: 4,
        awayScore: 2,
        gameType: 'regular',
        date: '02.01.2025'
      }
    ]
    
    const standings = calculateStandings(teams, games)
    
    expect(standings[0].id).toBe('1') // 3 points, difference +0, scored 7
    expect(standings[0].goalsFor).toBe(7)
    expect(standings[1].id).toBe('2') // 3 points, difference +0, scored 7
    expect(standings[1].goalsFor).toBe(7)
  })

  it('should include all team properties in the result', () => {
    const teams = [
      { id: '1', name: 'Команда 1', logo: '🏒', color: '#1e3c72' }
    ]
    
    const games = []
    
    const standings = calculateStandings(teams, games)
    
    expect(standings[0]).toHaveProperty('id')
    expect(standings[0]).toHaveProperty('name')
    expect(standings[0]).toHaveProperty('logo')
    expect(standings[0]).toHaveProperty('color')
    expect(standings[0]).toHaveProperty('gamesPlayed')
    expect(standings[0]).toHaveProperty('points')
  })

  it('should correctly calculate statistics for all teams', () => {
    const teams = [
      { id: '1', name: 'Команда 1', logo: '🏒', color: '#1e3c72' },
      { id: '2', name: 'Команда 2', logo: '🥅', color: '#c62828' },
      { id: '3', name: 'Команда 3', logo: '⛸️', color: '#2e7d32' }
    ]
    
    const games = [
      {
        id: '1',
        homeTeamId: '1',
        awayTeamId: '2',
        homeScore: 3,
        awayScore: 2,
        gameType: 'regular',
        date: '01.01.2025'
      },
      {
        id: '2',
        homeTeamId: '2',
        awayTeamId: '3',
        homeScore: 1,
        awayScore: 1,
        gameType: 'regular',
        date: '02.01.2025'
      },
      {
        id: '3',
        homeTeamId: '3',
        awayTeamId: '1',
        homeScore: 2,
        awayScore: 1,
        gameType: 'shootout',
        date: '03.01.2025'
      }
    ]
    
    const standings = calculateStandings(teams, games)
    
    // Team 1: 1 win (3 points), 1 shootout loss (0 points) = 3 points
    expect(standings.find(s => s.id === '1').points).toBe(3)
    expect(standings.find(s => s.id === '1').wins).toBe(1)
    expect(standings.find(s => s.id === '1').lossesOT).toBe(1)
    
    // Team 2: 1 loss (0 points), 1 draw (1 point) = 1 point
    expect(standings.find(s => s.id === '2').points).toBe(1)
    expect(standings.find(s => s.id === '2').losses).toBe(1)
    expect(standings.find(s => s.id === '2').draws).toBe(1)
    
    // Team 3: 1 draw (1 point), 1 shootout win (2 points) = 3 points
    expect(standings.find(s => s.id === '3').points).toBe(3)
    expect(standings.find(s => s.id === '3').draws).toBe(1)
    expect(standings.find(s => s.id === '3').winsOT).toBe(1)
  })
})

