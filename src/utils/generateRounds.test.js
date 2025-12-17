import { describe, expect, it, vi } from 'vitest'
import { generateRoundRobinGames } from './generateRounds'

describe('generateRoundRobinGames', () => {
  it('returns [] when not enough teams or rounds', () => {
    expect(generateRoundRobinGames([], 1)).toEqual([])
    expect(generateRoundRobinGames(['1'], 1)).toEqual([])
    expect(generateRoundRobinGames(['1', '2'], 0)).toEqual([])
  })

  it('generates pairings * rounds games, pending=true, round set', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789)

    const teamIds = ['1', '2', '3'] // pairs=3
    const rounds = 2
    const games = generateRoundRobinGames(teamIds, rounds)

    expect(games).toHaveLength(3 * 2)
    expect(new Set(games.map(g => g.id)).size).toBe(games.length)
    expect(games.every(g => g.pending === true)).toBe(true)
    expect(games.every(g => typeof g.homeTeamId === 'string' && typeof g.awayTeamId === 'string')).toBe(true)
    expect(games.every(g => g.round === 1 || g.round === 2)).toBe(true)

    vi.restoreAllMocks()
  })
})

