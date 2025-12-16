// Supabase утилиты для работы с базой данных
import { getSupabaseClient } from '../config/supabase'

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
    const teams = (teamsResult.data || []).map(team => ({
      id: String(team.id),
      name: String(team.name || ''),
      logo: String(team.logo || '🏒'),
      color: String(team.color || '#1e3c72')
    }))

    const games = (gamesResult.data || []).map(game => ({
      id: String(game.id),
      homeTeamId: String(game.homeTeamId),
      awayTeamId: String(game.awayTeamId),
      homeScore: parseInt(game.homeScore) || 0,
      awayScore: parseInt(game.awayScore) || 0,
      gameType: String(game.gameType || 'regular'),
      date: String(game.date || ''),
      pending: game.pending === true
    }))

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
      pending: game.pending === true
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
