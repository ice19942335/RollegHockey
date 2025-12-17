import { describe, expect, it } from 'vitest'
import { calculateTeamStats, calculateStandings } from './calculateStats'

describe('calculateTeamStats', () => {
  it('ignores pending games', () => {
    const games = [
      { homeTeamId: '1', awayTeamId: '2', homeScore: 2, awayScore: 0, gameType: 'regular', pending: true },
      { homeTeamId: '1', awayTeamId: '2', homeScore: 1, awayScore: 1, gameType: 'regular', pending: false }
    ]

    const stats = calculateTeamStats('1', games)
    expect(stats.gamesPlayed).toBe(1)
    expect(stats.draws).toBe(1)
    expect(stats.points).toBe(1)
  })

  it('awards points: regular win=3, shootout win=2, draw=1, losses=0', () => {
    const games = [
      // team 1 regular win
      { homeTeamId: '1', awayTeamId: '2', homeScore: 3, awayScore: 1, gameType: 'regular', pending: false },
      // team 1 shootout win
      { homeTeamId: '3', awayTeamId: '1', homeScore: 1, awayScore: 2, gameType: 'shootout', pending: false },
      // draw
      { homeTeamId: '1', awayTeamId: '4', homeScore: 0, awayScore: 0, gameType: 'regular', pending: false },
      // regular loss
      { homeTeamId: '5', awayTeamId: '1', homeScore: 2, awayScore: 1, gameType: 'regular', pending: false },
      // shootout loss (still 0 in this ruleset)
      { homeTeamId: '1', awayTeamId: '6', homeScore: 1, awayScore: 2, gameType: 'shootout', pending: false }
    ]

    const stats = calculateTeamStats('1', games)
    expect(stats.gamesPlayed).toBe(5)
    expect(stats.wins).toBe(1)
    expect(stats.winsOT).toBe(1)
    expect(stats.draws).toBe(1)
    expect(stats.losses).toBe(1)
    expect(stats.lossesOT).toBe(1)
    expect(stats.points).toBe(3 + 2 + 1 + 0 + 0)
  })
})

describe('calculateStandings', () => {
  it('sorts by points, then goal difference, then goals for', () => {
    const teams = [
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' }
    ]

    // Create stats:
    // A: 3 points, GD +1, GF 2
    // B: 3 points, GD +1, GF 3 (should rank above A)
    // C: 3 points, GD  0, GF 1 (below A/B)
    const games = [
      { homeTeamId: 'A', awayTeamId: 'X', homeScore: 2, awayScore: 1, gameType: 'regular', pending: false }, // A +3, GD +1, GF2
      { homeTeamId: 'B', awayTeamId: 'Y', homeScore: 3, awayScore: 2, gameType: 'regular', pending: false }, // B +3, GD +1, GF3
      { homeTeamId: 'C', awayTeamId: 'Z', homeScore: 1, awayScore: 0, gameType: 'regular', pending: false }, // C +3, GD +1, GF1
      // add a loss to C to bring GD to 0 but keep points 3 (loss gives 0)
      { homeTeamId: 'Z', awayTeamId: 'C', homeScore: 1, awayScore: 0, gameType: 'regular', pending: false }
    ]

    const standings = calculateStandings(teams, games)
    expect(standings.map(t => t.id)).toEqual(['B', 'A', 'C'])
  })
})

