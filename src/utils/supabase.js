// Supabase утилиты для работы с базой данных
import { getSupabaseClient } from '../config/supabase'

function normalizeTeamRow(team) {
  if (!team) return null
  return {
    id: String(team.id),
    name: String(team.name || ''),
    logo: String(team.logo || '🏒'),
    color: String(team.color || '#1e3c72')
  }
}

function normalizeGameRow(game) {
  if (!game) return null
  return {
    id: String(game.id),
    homeTeamId: String(game.homeTeamId),
    awayTeamId: String(game.awayTeamId),
    homeScore: parseInt(game.homeScore) || 0,
    awayScore: parseInt(game.awayScore) || 0,
    gameType: String(game.gameType || 'regular'),
    date: String(game.date || ''),
    pending: game.pending === true,
    round:
      game.round === null || game.round === undefined || game.round === ''
        ? null
        : parseInt(game.round, 10) || null
  }
}

/**
 * Подписка на realtime изменения игр/команд турнира (Postgres Changes).
 * Требует включенного Realtime для таблиц в Supabase.
 *
 * @param {string} tournamentId
 * @param {{
 *   onGameChange?: (payload: any) => void,
 *   onTeamChange?: (payload: any) => void,
 * }} handlers
 * @returns {() => void} unsubscribe
 */
export function subscribeToTournamentRealtime(tournamentId, handlers = {}) {
  if (!tournamentId) return () => {}
  const supabase = getSupabaseClient()

  const channel = supabase.channel(`tournament:${tournamentId}`)

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'rolleg_games',
      filter: `tournamentId=eq.${tournamentId}`
    },
    payload => {
      handlers?.onGameChange?.(payload)
    }
  )

  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'rolleg_teams',
      filter: `tournamentId=eq.${tournamentId}`
    },
    payload => {
      handlers?.onTeamChange?.(payload)
    }
  )

  channel.subscribe()

  return () => {
    try {
      supabase.removeChannel(channel)
    } catch (e) {
      // no-op
    }
  }
}

/**
 * Загружает данные из Supabase для конкретного турнира
 * @param {string} tournamentId - ID турнира
 * @returns {Promise<{teams: Array, games: Array}>}
 */
export async function loadDataFromSupabase(tournamentId) {
  try {
    if (!tournamentId) {
      return { teams: [], games: [] }
    }

    const supabase = getSupabaseClient()

    // Загружаем команды и игры параллельно
    const [teamsResult, gamesResult] = await Promise.all([
      supabase
        .from('rolleg_teams')
        .select('*')
        .eq('tournamentId', tournamentId),
      supabase
        .from('rolleg_games')
        .select('*')
        .eq('tournamentId', tournamentId)
    ])

    // Обрабатываем ошибки
    if (teamsResult.error) {
      console.error('Ошибка загрузки команд:', teamsResult.error)
      return { teams: [], games: [] }
    }

    if (gamesResult.error) {
      console.error('Ошибка загрузки игр:', gamesResult.error)
      return { teams: teamsResult.data || [], games: [] }
    }

    // Преобразуем данные в нужный формат
    const teams = (teamsResult.data || []).map(normalizeTeamRow).filter(Boolean)
    const games = (gamesResult.data || []).map(normalizeGameRow).filter(Boolean)

    return { teams, games }
  } catch (error) {
    console.error('Ошибка загрузки данных из Supabase:', error)
    return { teams: [], games: [] }
  }
}

/**
 * Сохраняет данные в Supabase
 * @param {Array} teams - массив команд
 * @param {Array} games - массив игр
 * @param {Array} standings - массив турнирной таблицы (игнорируется, вычисляется на лету)
 * @param {string} tournamentId - ID турнира
 * @returns {Promise<boolean>}
 */
export async function saveDataToSupabase(teams, games, standings = [], tournamentId = null) {
  try {
    if (!tournamentId) {
      console.warn('saveDataToSupabase: tournamentId не указан')
      return false
    }

    const supabase = getSupabaseClient()

    // Подготавливаем данные для вставки
    const teamsData = (teams || []).map(team => ({
      id: String(team.id),
      tournamentId: String(tournamentId),
      name: String(team.name || ''),
      logo: String(team.logo || '🏒'),
      color: String(team.color || '#1e3c72')
    }))

    const gamesData = (games || []).map(game => ({
      id: String(game.id),
      tournamentId: String(tournamentId),
      homeTeamId: String(game.homeTeamId),
      awayTeamId: String(game.awayTeamId),
      homeScore: parseInt(game.homeScore) || 0,
      awayScore: parseInt(game.awayScore) || 0,
      gameType: String(game.gameType || 'regular'),
      date: String(game.date || ''),
      pending: game.pending === true,
      // round сохраняем как число или null
      round: game.round === null || game.round === undefined || game.round === ''
        ? null
        : parseInt(game.round, 10) || null
    }))

    // Стратегия сохранения: удаляем все существующие данные и вставляем новые
    // Это проще, чем отслеживать изменения каждого элемента

    // 1. Удаляем все игры турнира
    const { error: deleteGamesError } = await supabase
      .from('rolleg_games')
      .delete()
      .eq('tournamentId', tournamentId)

    if (deleteGamesError) {
      console.error('Ошибка удаления игр:', deleteGamesError)
      // Продолжаем, так как это может быть нормально для нового турнира
    }

    // 2. Удаляем все команды турнира
    const { error: deleteTeamsError } = await supabase
      .from('rolleg_teams')
      .delete()
      .eq('tournamentId', tournamentId)

    if (deleteTeamsError) {
      console.error('Ошибка удаления команд:', deleteTeamsError)
      // Продолжаем, так как это может быть нормально для нового турнира
    }

    // 3. Вставляем команды (если есть)
    if (teamsData.length > 0) {
      const { error: insertTeamsError } = await supabase
        .from('rolleg_teams')
        .insert(teamsData)

      if (insertTeamsError) {
        console.error('Ошибка вставки команд:', insertTeamsError)
        return false
      }
    }

    // 4. Вставляем игры (если есть)
    if (gamesData.length > 0) {
      const { error: insertGamesError } = await supabase
        .from('rolleg_games')
        .insert(gamesData)

      if (insertGamesError) {
        console.error('Ошибка вставки игр:', insertGamesError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Ошибка сохранения данных в Supabase:', error)
    return false
  }
}

/**
 * Загружает список всех турниров из Supabase
 * @returns {Promise<Array>} Массив турниров
 */
export async function loadTournamentsList() {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('rolleg_tournaments')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Ошибка загрузки списка турниров:', error)
      return []
    }

    // Преобразуем данные в нужный формат
    const tournaments = (data || []).map(tournament => ({
      id: String(tournament.id),
      name: String(tournament.name || ''),
      startDate: tournament.startDate ? String(tournament.startDate) : '',
      endDate: tournament.endDate ? String(tournament.endDate) : '',
      description: tournament.description ? String(tournament.description) : '',
      createdAt: tournament.createdAt ? String(tournament.createdAt) : new Date().toISOString()
    }))

    return tournaments
  } catch (error) {
    console.error('Ошибка загрузки списка турниров:', error)
    return []
  }
}

/**
 * Создает новый турнир
 * @param {Object} tournamentData - Данные турнира {name, startDate, endDate, description}
 * @returns {Promise<{success: boolean, tournamentId: string|null, error: string|null}>}
 */
export async function createTournament(tournamentData) {
  try {
    const supabase = getSupabaseClient()

    // Генерируем уникальный ID для турнира
    const tournamentId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)

    const tournament = {
      id: tournamentId,
      name: String(tournamentData.name || ''),
      startDate: tournamentData.startDate || null,
      endDate: tournamentData.endDate || null,
      description: tournamentData.description || '',
      createdAt: new Date().toISOString()
    }

    const { error } = await supabase
      .from('rolleg_tournaments')
      .insert([tournament])

    if (error) {
      console.error('Ошибка создания турнира:', error)
      return { 
        success: false, 
        tournamentId: null, 
        error: error.message || 'Ошибка при создании турнира' 
      }
    }

    return { success: true, tournamentId, error: null }
  } catch (error) {
    console.error('Ошибка создания турнира:', error)
    return { 
      success: false, 
      tournamentId: null, 
      error: error.message || 'Неизвестная ошибка' 
    }
  }
}

/**
 * Удаляет турнир из Supabase
 * @param {string} tournamentId - ID турнира для удаления
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
/**
 * Получает статистику всех данных в базе
 * @returns {Promise<{tournaments: number, teams: number, games: number}>}
 */
export async function getDatabaseStats() {
  try {
    const supabase = getSupabaseClient()

    const [tournamentsResult, teamsResult, gamesResult] = await Promise.all([
      supabase.from('rolleg_tournaments').select('id', { count: 'exact', head: true }),
      supabase.from('rolleg_teams').select('id', { count: 'exact', head: true }),
      supabase.from('rolleg_games').select('id', { count: 'exact', head: true })
    ])

    return {
      tournaments: tournamentsResult.count || 0,
      teams: teamsResult.count || 0,
      games: gamesResult.count || 0
    }
  } catch (error) {
    console.error('Ошибка получения статистики базы данных:', error)
    return { tournaments: 0, teams: 0, games: 0 }
  }
}

/**
 * Удаляет все данные из базы данных
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function clearAllDatabase() {
  try {
    const supabase = getSupabaseClient()

    // Загружаем все ID для удаления
    // Сначала получаем все игры
    const { data: allGames, error: gamesSelectError } = await supabase
      .from('rolleg_games')
      .select('id')

    if (gamesSelectError) {
      console.error('Ошибка загрузки игр:', gamesSelectError)
      return {
        success: false,
        error: gamesSelectError.message || 'Ошибка при загрузке игр'
      }
    }

    // Удаляем все игры
    if (allGames && allGames.length > 0) {
      const gameIds = allGames.map(g => g.id)
      // Удаляем батчами по 100 записей
      for (let i = 0; i < gameIds.length; i += 100) {
        const batch = gameIds.slice(i, i + 100)
        const { error: gamesError } = await supabase
          .from('rolleg_games')
          .delete()
          .in('id', batch)

        if (gamesError) {
          console.error('Ошибка удаления игр:', gamesError)
          return {
            success: false,
            error: gamesError.message || 'Ошибка при удалении игр'
          }
        }
      }
    }

    // Получаем все команды
    const { data: allTeams, error: teamsSelectError } = await supabase
      .from('rolleg_teams')
      .select('id')

    if (teamsSelectError) {
      console.error('Ошибка загрузки команд:', teamsSelectError)
      return {
        success: false,
        error: teamsSelectError.message || 'Ошибка при загрузке команд'
      }
    }

    // Удаляем все команды
    if (allTeams && allTeams.length > 0) {
      const teamIds = allTeams.map(t => t.id)
      // Удаляем батчами по 100 записей
      for (let i = 0; i < teamIds.length; i += 100) {
        const batch = teamIds.slice(i, i + 100)
        const { error: teamsError } = await supabase
          .from('rolleg_teams')
          .delete()
          .in('id', batch)

        if (teamsError) {
          console.error('Ошибка удаления команд:', teamsError)
          return {
            success: false,
            error: teamsError.message || 'Ошибка при удалении команд'
          }
        }
      }
    }

    // Получаем все турниры
    const { data: allTournaments, error: tournamentsSelectError } = await supabase
      .from('rolleg_tournaments')
      .select('id')

    if (tournamentsSelectError) {
      console.error('Ошибка загрузки турниров:', tournamentsSelectError)
      return {
        success: false,
        error: tournamentsSelectError.message || 'Ошибка при загрузке турниров'
      }
    }

    // Удаляем все турниры
    if (allTournaments && allTournaments.length > 0) {
      const tournamentIds = allTournaments.map(t => t.id)
      // Удаляем батчами по 100 записей
      for (let i = 0; i < tournamentIds.length; i += 100) {
        const batch = tournamentIds.slice(i, i + 100)
        const { error: tournamentsError } = await supabase
          .from('rolleg_tournaments')
          .delete()
          .in('id', batch)

        if (tournamentsError) {
          console.error('Ошибка удаления турниров:', tournamentsError)
          return {
            success: false,
            error: tournamentsError.message || 'Ошибка при удалении турниров'
          }
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Ошибка очистки базы данных:', error)
    return {
      success: false,
      error: error.message || 'Ошибка при очистке базы данных'
    }
  }
}

export async function deleteTournament(tournamentId) {
  try {
    if (!tournamentId) {
      return { success: false, error: 'ID турнира не указан' }
    }

    const supabase = getSupabaseClient()

    // Благодаря CASCADE, удаление турнира автоматически удалит все связанные команды и игры
    const { error } = await supabase
      .from('rolleg_tournaments')
      .delete()
      .eq('id', tournamentId)

    if (error) {
      console.error('Ошибка удаления турнира:', error)
      return {
        success: false,
        error: error.message || 'Ошибка при удалении турнира'
      }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Ошибка удаления турнира:', error)
    return { 
      success: false, 
      error: error.message || 'Неизвестная ошибка' 
    }
  }
}

// ============================
// Targeted operations (no bulk delete+insert)
// ============================

export async function upsertTeamInSupabase(team, tournamentId) {
  try {
    if (!tournamentId) return { data: null, error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const payload = {
      id: String(team.id),
      tournamentId: String(tournamentId),
      name: String(team.name || ''),
      logo: String(team.logo || '🏒'),
      color: String(team.color || '#1e3c72')
    }

    const { data, error } = await supabase
      .from('rolleg_teams')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    return { data: normalizeTeamRow(data), error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function upsertTeamsInSupabase(teams, tournamentId) {
  try {
    if (!tournamentId) return { data: [], error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const payload = (teams || []).map(team => ({
      id: String(team.id),
      tournamentId: String(tournamentId),
      name: String(team.name || ''),
      logo: String(team.logo || '🏒'),
      color: String(team.color || '#1e3c72')
    }))

    if (payload.length === 0) return { data: [], error: null }

    const { data, error } = await supabase
      .from('rolleg_teams')
      .upsert(payload, { onConflict: 'id' })
      .select('*')

    return { data: (data || []).map(normalizeTeamRow).filter(Boolean), error }
  } catch (error) {
    return { data: [], error }
  }
}

export async function updateTeamNameInSupabase(teamId, tournamentId, name) {
  try {
    if (!tournamentId) return { data: null, error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('rolleg_teams')
      .update({ name: String(name || '') })
      .eq('id', String(teamId))
      .eq('tournamentId', String(tournamentId))
      .select('*')
      .single()

    return { data: normalizeTeamRow(data), error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function deleteTeamInSupabase(teamId, tournamentId) {
  try {
    if (!tournamentId) return { error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('rolleg_teams')
      .delete()
      .eq('id', String(teamId))
      .eq('tournamentId', String(tournamentId))

    return { error }
  } catch (error) {
    return { error }
  }
}

export async function deleteAllTeamsInSupabase(tournamentId) {
  try {
    if (!tournamentId) return { error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('rolleg_teams')
      .delete()
      .eq('tournamentId', String(tournamentId))
    return { error }
  } catch (error) {
    return { error }
  }
}

export async function upsertGameInSupabase(game, tournamentId) {
  try {
    if (!tournamentId) return { data: null, error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const payload = {
      id: String(game.id),
      tournamentId: String(tournamentId),
      homeTeamId: String(game.homeTeamId),
      awayTeamId: String(game.awayTeamId),
      homeScore: parseInt(game.homeScore) || 0,
      awayScore: parseInt(game.awayScore) || 0,
      gameType: String(game.gameType || 'regular'),
      date: String(game.date || ''),
      pending: game.pending === true,
      round:
        game.round === null || game.round === undefined || game.round === ''
          ? null
          : parseInt(game.round, 10) || null
    }

    const { data, error } = await supabase
      .from('rolleg_games')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    return { data: normalizeGameRow(data), error }
  } catch (error) {
    return { data: null, error }
  }
}

export async function upsertGamesInSupabase(games, tournamentId) {
  try {
    if (!tournamentId) return { data: [], error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const payload = (games || []).map(game => ({
      id: String(game.id),
      tournamentId: String(tournamentId),
      homeTeamId: String(game.homeTeamId),
      awayTeamId: String(game.awayTeamId),
      homeScore: parseInt(game.homeScore) || 0,
      awayScore: parseInt(game.awayScore) || 0,
      gameType: String(game.gameType || 'regular'),
      date: String(game.date || ''),
      pending: game.pending === true,
      round:
        game.round === null || game.round === undefined || game.round === ''
          ? null
          : parseInt(game.round, 10) || null
    }))

    if (payload.length === 0) return { data: [], error: null }

    const { data, error } = await supabase
      .from('rolleg_games')
      .upsert(payload, { onConflict: 'id' })
      .select('*')

    return { data: (data || []).map(normalizeGameRow).filter(Boolean), error }
  } catch (error) {
    return { data: [], error }
  }
}

export async function deleteGameInSupabase(gameId, tournamentId) {
  try {
    if (!tournamentId) return { error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('rolleg_games')
      .delete()
      .eq('id', String(gameId))
      .eq('tournamentId', String(tournamentId))
    return { error }
  } catch (error) {
    return { error }
  }
}

export async function deleteGamesByPendingInSupabase(tournamentId, pending) {
  try {
    if (!tournamentId) return { error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('rolleg_games')
      .delete()
      .eq('tournamentId', String(tournamentId))
      .eq('pending', pending === true)
    return { error }
  } catch (error) {
    return { error }
  }
}

export async function deleteNonPendingGamesInSupabase(tournamentId) {
  return deleteGamesByPendingInSupabase(tournamentId, false)
}

export async function updateGamePendingInSupabase(gameId, tournamentId, pending) {
  try {
    if (!tournamentId) return { data: null, error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('rolleg_games')
      .update({ pending: pending === true })
      .eq('id', String(gameId))
      .eq('tournamentId', String(tournamentId))
      .select('*')
      .single()
    return { data: normalizeGameRow(data), error }
  } catch (error) {
    return { data: null, error }
  }
}

/**
 * CAS update of one side score: prevents lost updates in concurrent clients.
 * If the expected score mismatches, it returns latest row (best-effort).
 */
export async function updateGameScoreDeltaInSupabase({
  gameId,
  tournamentId,
  side,
  delta,
  expectedHomeScore,
  expectedAwayScore
}) {
  try {
    if (!tournamentId) return { data: null, error: new Error('tournamentId is required') }
    const supabase = getSupabaseClient()

    const deltaInt = parseInt(delta) || 0
    const expectedHome = parseInt(expectedHomeScore) || 0
    const expectedAway = parseInt(expectedAwayScore) || 0

    const isHome = side === 'home'
    const isAway = side === 'away'
    if (!isHome && !isAway) {
      return { data: null, error: new Error('side must be \"home\" or \"away\"') }
    }

    // Prefer RPC: atomic update (no lost increments)
    // Requires running the SQL in supabase-migration.sql (function public.rolleg_increment_game_score)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('rolleg_increment_game_score', {
        p_game_id: String(gameId),
        p_tournament_id: String(tournamentId),
        p_side: side,
        p_delta: deltaInt
      })

      if (!rpcError) {
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
        if (row) {
          return { data: normalizeGameRow(row), error: null, conflict: false, via: 'rpc' }
        }
      }
      // If function is missing/not deployed yet, fall back to CAS below.
      // Otherwise, surface the error.
      const rpcMessage = String(rpcError?.message || '')
      const rpcCode = String(rpcError?.code || '')
      const fnMissing =
        rpcCode === 'PGRST202' ||
        rpcMessage.toLowerCase().includes('could not find the function') ||
        rpcMessage.toLowerCase().includes('function') && rpcMessage.toLowerCase().includes('does not exist')
      if (!fnMissing) {
        return { data: null, error: rpcError, conflict: false, via: 'rpc' }
      }
    } catch (e) {
      // ignore and fall back
    }

    const nextValue = isHome ? Math.max(0, expectedHome + deltaInt) : Math.max(0, expectedAway + deltaInt)
    const field = isHome ? 'homeScore' : 'awayScore'
    const expectedValue = isHome ? expectedHome : expectedAway

    let q = supabase
      .from('rolleg_games')
      .update({ [field]: nextValue })
      .eq('id', String(gameId))
      .eq('tournamentId', String(tournamentId))
      .eq(field, expectedValue)

    const { data, error } = await q.select('*')
    if (error) return { data: null, error }

    if (!data || data.length === 0) {
      // conflict: fetch latest
      const { data: latest, error: fetchError } = await supabase
        .from('rolleg_games')
        .select('*')
        .eq('id', String(gameId))
        .eq('tournamentId', String(tournamentId))
        .single()
      return { data: normalizeGameRow(latest), error: fetchError || null, conflict: true }
    }

    return { data: normalizeGameRow(data[0]), error: null, conflict: false }
  } catch (error) {
    return { data: null, error }
  }
}
