import { describe, expect, it, vi, beforeEach } from 'vitest'

// We mock getSupabaseClient before importing module under test.
let supabaseMock
vi.mock('../config/supabase', () => ({
  getSupabaseClient: () => supabaseMock
}))

import { subscribeToTournamentRealtime, updateGameScoreDeltaInSupabase } from './supabase'

describe('subscribeToTournamentRealtime', () => {
  beforeEach(() => {
    supabaseMock = {
      channel: vi.fn(() => {
        const ch = {
          on: vi.fn(() => ch),
          subscribe: vi.fn(() => ch)
        }
        return ch
      }),
      removeChannel: vi.fn()
    }
  })

  it('subscribes to games and teams changes and returns unsubscribe', () => {
    const onGameChange = vi.fn()
    const onTeamChange = vi.fn()
    const unsubscribe = subscribeToTournamentRealtime('t1', { onGameChange, onTeamChange })

    expect(supabaseMock.channel).toHaveBeenCalledWith('tournament:t1')
    expect(supabaseMock.removeChannel).not.toHaveBeenCalled()

    unsubscribe()
    expect(supabaseMock.removeChannel).toHaveBeenCalledTimes(1)
  })
})

describe('updateGameScoreDeltaInSupabase', () => {
  it('prefers RPC and returns normalized row', async () => {
    supabaseMock = {
      rpc: vi.fn(async () => ({
        data: [
          {
            id: 'g1',
            homeTeamId: 'h',
            awayTeamId: 'a',
            homeScore: 2,
            awayScore: 1,
            gameType: 'regular',
            date: 'x',
            pending: true,
            round: 1
          }
        ],
        error: null
      }))
    }

    const res = await updateGameScoreDeltaInSupabase({
      gameId: 'g1',
      tournamentId: 't1',
      side: 'home',
      delta: 1,
      expectedHomeScore: 1,
      expectedAwayScore: 1
    })

    expect(supabaseMock.rpc).toHaveBeenCalledWith('rolleg_increment_game_score', {
      p_game_id: 'g1',
      p_tournament_id: 't1',
      p_side: 'home',
      p_delta: 1
    })
    expect(res.error).toBeNull()
    expect(res.data).toMatchObject({ id: 'g1', homeScore: 2, awayScore: 1 })
  })

  it('falls back to CAS when RPC function is missing', async () => {
    const select = vi.fn(async () => ({
      data: [
        {
          id: 'g1',
          homeTeamId: 'h',
          awayTeamId: 'a',
          homeScore: 2,
          awayScore: 1,
          gameType: 'regular',
          date: 'x',
          pending: true,
          round: 1
        }
      ],
      error: null
    }))

    const eq3 = vi.fn(() => ({ select }))
    const eq2 = vi.fn(() => ({ eq: eq3 }))
    const eq1 = vi.fn(() => ({ eq: eq2 }))
    const update = vi.fn(() => ({ eq: eq1 }))
    const from = vi.fn(() => ({ update }))

    supabaseMock = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { code: 'PGRST202', message: 'Could not find the function public.rolleg_increment_game_score' }
      })),
      from
    }

    const res = await updateGameScoreDeltaInSupabase({
      gameId: 'g1',
      tournamentId: 't1',
      side: 'home',
      delta: 1,
      expectedHomeScore: 1,
      expectedAwayScore: 1
    })

    expect(from).toHaveBeenCalledWith('rolleg_games')
    expect(update).toHaveBeenCalledWith({ homeScore: 2 })
    expect(res.error).toBeNull()
    expect(res.data).toMatchObject({ id: 'g1', homeScore: 2 })
  })
})

