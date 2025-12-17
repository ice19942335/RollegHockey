import { describe, expect, it, vi } from 'vitest'
import { generateRandomTeams } from './generateRandomTeams'

describe('generateRandomTeams', () => {
  it('returns [] for invalid count', () => {
    expect(generateRandomTeams(0)).toEqual([])
    expect(generateRandomTeams(-1)).toEqual([])
  })

  it('generates requested count and avoids existing team names', () => {
    // Make randomness deterministic enough for assertions
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000)
    vi.spyOn(Math, 'random').mockReturnValue(0.42)

    const existingTeams = [{ id: 'x', name: 'Рига', logo: '🏒', color: '#000' }]
    const teams = generateRandomTeams(3, 'ru', existingTeams)

    expect(teams).toHaveLength(3)
    expect(new Set(teams.map(t => t.id)).size).toBe(3)
    expect(teams.every(t => typeof t.name === 'string' && t.name.trim().length > 0)).toBe(true)
    expect(teams.every(t => t.name.toLowerCase().trim() !== 'рига')).toBe(true)

    vi.restoreAllMocks()
  })
})

