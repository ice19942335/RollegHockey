// ⚠️ ВНИМАНИЕ: Этот файл больше не используется!
// Приложение перешло на Supabase для хранения данных.
// Этот файл оставлен только для справки и может быть удален в будущем.

// Google Sheets API утилиты (НЕ ИСПОЛЬЗУЕТСЯ)
import { getSpreadsheetId, getGoogleAppsScriptId } from '../config/googleSheets.js'

// Для записи и чтения используем Google Apps Script

/**
 * Загружает данные из Google Sheets для конкретного турнира
 * @param {string} tournamentId - ID турнира (опционально, для обратной совместимости)
 * @returns {Promise<{teams: Array, games: Array}>}
 */
export async function loadDataFromSheets(tournamentId = null) {
  try {
    const spreadsheetId = getSpreadsheetId()
    let targetGid = 0 // По умолчанию первый лист
    
    // Если указан tournamentId, находим правильный gid
    if (tournamentId) {
      const sheetName = `turnament_${tournamentId}`
      console.log('🔍 [loadDataFromSheets] Ищем лист:', sheetName)
      
      const sheetsList = await getSheetsList()
      if (sheetsList && sheetsList.length > 0) {
        const tournamentSheet = sheetsList.find(sheet => 
          sheet.name === sheetName || 
          sheet.name.toLowerCase() === sheetName.toLowerCase()
        )
        
        if (tournamentSheet) {
          targetGid = tournamentSheet.gid
          console.log('✅ [loadDataFromSheets] Найден лист, используем gid:', targetGid)
        } else {
          console.warn('⚠️ [loadDataFromSheets] Лист не найден:', sheetName, 'Используем gid=0')
        }
      } else {
        console.warn('⚠️ [loadDataFromSheets] Не удалось получить список листов, используем gid=0')
      }
    }
    
    // Пробуем сначала через Google Apps Script, затем fallback к CSV экспорту
    const scriptId = getGoogleAppsScriptId()
    let csvText = ''
    
    // Способ 1: Пробуем через Google Apps Script (если настроен и поддерживает getSheetData)
    if (scriptId && !scriptId.includes('YOUR_SCRIPT_ID')) {
      try {
        const scriptUrl = `https://script.google.com/macros/s/${scriptId}/exec?action=getSheetData&gid=${targetGid}`
        const response = await fetch(scriptUrl, {
          method: 'GET',
          mode: 'cors'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.csv) {
            csvText = data.csv
          }
        }
      } catch (error) {
        // Продолжаем к fallback методу
      }
    }
    
    // Способ 2: Fallback к CSV экспорту (если Apps Script не сработал)
    if (!csvText) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${targetGid}`
        const response = await fetch(csvUrl, {
          redirect: 'follow',
          credentials: 'omit'
        })
        
        if (response.ok && response.status === 200) {
          const arrayBuffer = await response.arrayBuffer()
          const decoder = new TextDecoder('utf-8')
          csvText = decoder.decode(arrayBuffer)
        }
      } catch (error) {
        console.warn('⚠️ [loadDataFromSheets] Не удалось загрузить данные:', error.message)
        return { teams: [], games: [] }
      }
    }
    
    if (!csvText) {
      return { teams: [], games: [] }
    }
    
    const lines = csvText.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return { teams: [], games: [] }
    }
    
    // Парсим CSV
    const teams = []
    const games = []
    const teamIds = new Set() // Для отслеживания уникальности ID
    
    // Предполагаем структуру: первая строка - заголовки
    // Команды: id, name, logo, color
    // Игры: id, homeTeamId, awayTeamId, homeScore, awayScore, gameType, date
    
    let isTeamsSection = false
    let isGamesSection = false
    let skipHeader = true
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Проверяем заголовок TEAMS (может быть "TEAMS id" в одной ячейке или отдельная строка "TEAMS")
      if (line.includes('TEAMS') || line.includes('Команды')) {
        isTeamsSection = true
        isGamesSection = false
        skipHeader = true
        // Если это заголовок с "TEAMS id" в одной ячейке, пропускаем его
        if (line.includes('id') && line.includes('name')) {
          continue
        }
        continue
      }
      
      if (line === 'GAMES' || line === 'Игры' || line.includes('GAMES') || line.includes('Игры')) {
        isTeamsSection = false
        isGamesSection = true
        skipHeader = true
        continue
      }
      
      // Если видим заголовок с awayTeamId или homeTeamId, это начало секции GAMES (даже если нет явной строки "GAMES")
      if (line.includes('awayTeamId') || (line.includes('homeTeamId') && line.includes('awayTeamId'))) {
        isTeamsSection = false
        isGamesSection = true
        skipHeader = false // Заголовок уже найден, пропустим его в следующей проверке
        continue
      }
      
      // Обрабатываем секцию STANDINGS - отключаем парсинг игр
      if (line === 'STANDINGS' || line === 'Турнирная таблица' || 
          (line.includes('STANDINGS') && !line.includes('homeTeamId') && !line.includes('awayTeamId')) || 
          (line.includes('teamId') && line.includes('teamName') && line.includes('gamesPlayed'))) {
        isTeamsSection = false
        isGamesSection = false // Отключаем парсинг игр, так как началась секция standings
        skipHeader = true
        continue
      }
      
      // Пропускаем заголовки для команд (может быть "TEAMS id" в одной ячейке или отдельная строка с "id" и "name")
      if (isTeamsSection && (line.includes('id') && line.includes('name'))) {
        skipHeader = false
        continue
      }
      
      // Пропускаем заголовки для игр
      if (skipHeader && isGamesSection && (line.includes('id') && line.includes('homeTeamId'))) {
        skipHeader = false
        continue
      }
      
      skipHeader = false
      
      if (isTeamsSection && line && line.trim()) {
        // Пропускаем заголовки
        if (line.includes('TEAMS') || (line.includes('id') && line.includes('name'))) {
          continue
        }
        
        const values = parseCSVLine(line)
        
        // Сохраняем первые 4 значения (id, name, logo, color), даже если они пустые
        // Google Sheets может добавлять много пустых колонок в конце
        const cleanValues = []
        for (let i = 0; i < Math.max(4, values.length); i++) {
          if (i < 4) {
            // Первые 4 значения всегда добавляем (id, name, logo, color)
            cleanValues.push(values[i] !== undefined ? values[i] : '')
          } else if (values[i] && values[i].trim()) {
            // После 4-го значения добавляем только непустые
            cleanValues.push(values[i])
          }
        }
        
        // Проверяем, что это действительно строка с данными команды (не заголовок)
        // values[0] должен быть ID (не пустой и не "id")
        if (cleanValues.length >= 4 && 
            cleanValues[0] && cleanValues[0].trim() && 
            cleanValues[0].trim() !== 'id' && 
            !cleanValues[0].trim().includes('TEAMS')) {
          
          const teamId = String(cleanValues[0].trim())
          // Берем имя из второй колонки, если оно есть
          const teamName = cleanValues[1] && cleanValues[1].trim() ? String(cleanValues[1].trim()) : `Команда ${teamId.slice(-4)}`
          const teamLogo = (cleanValues[2] || '🏒').trim()
          const teamColor = (cleanValues[3] || '#1e3c72').trim()
          
          // Проверяем, что название не является заголовком
          if (teamName !== 'name') {
            // Проверяем на дубликаты
            if (!teamIds.has(teamId)) {
              teamIds.add(teamId)
              teams.push({
                id: teamId,
                name: teamName,
                logo: teamLogo,
                color: teamColor
              })
            }
          }
        }
      }

      if (isGamesSection && line && line.trim()) {
        // Пропускаем заголовки (строка должна содержать "awayTeamId" или "homeTeamId")
        if (line.includes('awayTeamId') || line.includes('homeTeamId') || 
            (line.includes('id') && (line.includes('gameType') || line.includes('date')))) {
          continue
        }
        
        // Дополнительная проверка: если строка содержит "teamName" или "position", это не игра, а standings
        if (line.includes('teamName') || line.includes('position') || line.includes('gamesPlayed')) {
          continue
        }
        
        const values = parseCSVLine(line)
        // Убираем пустые значения в конце массива
        const cleanValues = values.filter((v, index) => {
          // Оставляем первые 8 значений (id, homeTeamId, awayTeamId, homeScore, awayScore, gameType, date, pending) или непустые значения
          return index < 8 || v.trim() !== ''
        })
        
        // Проверяем, что это действительно строка с данными игры
        // Должно быть минимум 7 полей, и первые три не должны быть пустыми
        if (cleanValues.length >= 7 && 
            cleanValues[0] && cleanValues[0].trim() && 
            cleanValues[1] && cleanValues[1].trim() && 
            cleanValues[2] && cleanValues[2].trim()) {
          // Дополнительная проверка: убеждаемся, что это не заголовок
          if (cleanValues[0].trim() === 'id' || 
              cleanValues[1].trim() === 'homeTeamId' || 
              cleanValues[2].trim() === 'awayTeamId') {
            continue
          }
          
          // Проверяем, что homeTeamId и awayTeamId являются числами (ID команд), а не названиями
          // Если это название команды (содержит кириллицу или пробелы), пропускаем
          const homeTeamId = cleanValues[1].trim()
          const awayTeamId = cleanValues[2].trim()
          if (/[а-яА-ЯёЁ\s]/.test(homeTeamId) || /[а-яА-ЯёЁ\s]/.test(awayTeamId)) {
            continue
          }
          
          // Парсим поле pending (8-е значение, индекс 7)
          // Если значение 'true' (строка), то pending = true, иначе false
          const pendingValue = cleanValues[7] ? cleanValues[7].trim().toLowerCase() : ''
          const pending = pendingValue === 'true' || pendingValue === '1'
          
          const game = {
            id: String(cleanValues[0].trim()),
            homeTeamId: String(homeTeamId),
            awayTeamId: String(awayTeamId),
            homeScore: parseInt(cleanValues[3]) || 0,
            awayScore: parseInt(cleanValues[4]) || 0,
            gameType: (cleanValues[5] || 'regular').trim(),
            date: (cleanValues[6] || new Date().toLocaleDateString('ru-RU')).trim(),
            pending: pending
          }
          games.push(game)
        }
      }
    }
    
    return { teams, games }
  } catch (error) {
    return { teams: [], games: [] }
  }
}

/**
 * Сохраняет данные в Google Sheets через Google Apps Script Web App
 * Нужно создать Google Apps Script с функцией doPost для записи данных
 * @param {Array} teams - массив команд
 * @param {Array} games - массив игр
 * @param {Array} standings - массив турнирной таблицы
 * @param {string} tournamentId - ID турнира (опционально)
 * @returns {Promise<boolean>}
 */
export async function saveDataToSheets(teams, games, standings = [], tournamentId = null) {
  try {
    // Формируем данные для записи
    const data = {
      tournamentId: tournamentId || null, // Передаем tournamentId для сохранения в нужный лист
      sheetName: tournamentId ? `turnament_${tournamentId}` : null,
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        logo: team.logo,
        color: team.color
      })),
      games: games.map(game => ({
        id: game.id,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        gameType: game.gameType,
        date: game.date,
        pending: game.pending !== undefined ? game.pending : false
      })),
      standings: standings.map((team, index) => ({
        position: index + 1,
        teamId: team.id,
        teamName: team.name,
        gamesPlayed: team.gamesPlayed,
        wins: team.wins,
        winsOT: team.winsOT,
        losses: team.losses,
        lossesOT: team.lossesOT,
        goalsFor: team.goalsFor,
        goalsAgainst: team.goalsAgainst,
        goalDifference: team.goalDifference,
        points: team.points
      }))
    }
    
    // Используем Google Apps Script Web App URL
    // Нужно создать скрипт и опубликовать его как Web App
    // Инструкция в файле GOOGLE_SHEETS_SETUP.md
    const scriptId = getGoogleAppsScriptId()
    const scriptUrl = `https://script.google.com/macros/s/${scriptId}/exec`
    
    // Если URL не настроен
    if (scriptId.includes('YOUR_SCRIPT_ID') || !scriptId) {
      return false
    }
    
    try {
      // Отправляем данные в режиме no-cors
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      // В режиме no-cors невозможно проверить успешность запроса напрямую,
      // но если данные загружаются из таблицы, значит синхронизация работает
      return true
    } catch (error) {
      return false
    }
  } catch (error) {
    return false
  }
}

/**
 * Парсит строку CSV с учетом кавычек
 */
function parseCSVLine(line) {
  const values = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      // Если следующая кавычка тоже кавычка (экранированная кавычка), добавляем одну кавычку
      if (i + 1 < line.length && line[i + 1] === '"' && inQuotes) {
        current += '"'
        i++ // Пропускаем следующую кавычку
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Добавляем значение, даже если оно пустое
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Добавляем последнее значение
  values.push(current.trim())
  return values
}

/**
 * Получает список всех листов в таблице с их gid и названиями
 * Использует Google Sheets API v4 или Google Apps Script
 * @returns {Promise<Array<{name: string, gid: number}>>} Массив объектов с названием и gid листов
 */
async function getSheetsList() {
  try {
    const spreadsheetId = getSpreadsheetId()
    const scriptId = getGoogleAppsScriptId()
    
    // Способ 1: Используем Google Apps Script для получения списка листов
    // Это работает без API ключа и для любых таблиц (публичных и приватных)
    if (scriptId && !scriptId.includes('YOUR_SCRIPT_ID')) {
      try {
        const scriptUrl = `https://script.google.com/macros/s/${scriptId}/exec?action=getSheetsList`
        const response = await fetch(scriptUrl, {
          method: 'GET',
          mode: 'cors' // Используем cors для возможности прочитать ответ
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.sheets && Array.isArray(data.sheets)) {
            return data.sheets.map(sheet => ({
              name: sheet.name,
              gid: sheet.gid
            }))
          }
        }
      } catch (error) {
        // Продолжаем к следующему способу
      }
    }
    
    // Способ 2: Пробуем получить через Google Sheets API v4
    // Для публичных таблиц может работать без API ключа, но обычно требует аутентификацию
    // Пропускаем этот метод, так как он требует API ключ или OAuth
    // Используем только Google Apps Script или fallback метод перебора gid
    try {
      // API v4 обычно требует аутентификацию, поэтому пропускаем
      // Если нужен этот метод, нужно добавить API ключ или использовать OAuth
    } catch (error) {
      // Пропускаем API v4 метод
    }
    
    // Если оба способа не сработали, возвращаем null
    // Будет использован fallback метод перебора gid
    return null
  } catch (error) {
    return null
  }
}

/**
 * Загружает список всех турниров из листа "Tournaments"
 * Сначала получает список всех листов, затем ищет лист "Tournaments" и загружает данные
 * @returns {Promise<Array>} Массив турниров
 */
export async function loadTournamentsList() {
  try {
    const spreadsheetId = getSpreadsheetId()
    const tournaments = []
    
    // Константа для названия листа с турнирами
    const TOURNAMENTS_SHEET_NAME = 'Tournaments'
    
    // Шаг 1: Получаем список всех листов
    const sheetsList = await getSheetsList()
    console.log('📋 [loadTournamentsList] Список листов от Google:', sheetsList)
    
    let targetGid = null
    
    if (sheetsList && sheetsList.length > 0) {
      // Ищем лист "Tournaments" по названию
      const tournamentsSheet = sheetsList.find(sheet => 
        sheet.name === TOURNAMENTS_SHEET_NAME || 
        sheet.name.toLowerCase() === TOURNAMENTS_SHEET_NAME.toLowerCase()
      )
      
      console.log('🔍 [loadTournamentsList] Найден лист "Tournaments":', tournamentsSheet)
      
      if (tournamentsSheet) {
        targetGid = tournamentsSheet.gid
        console.log('✅ [loadTournamentsList] Используем gid для листа "Tournaments":', targetGid)
      } else {
        // Если не нашли по названию, пробуем найти по содержимому
        // Проверяем все листы на наличие заголовков турниров
        const scriptId = getGoogleAppsScriptId()
        for (const sheet of sheetsList) {
          try {
            let csvText = ''
            
            // Пробуем через Apps Script
            if (scriptId && !scriptId.includes('YOUR_SCRIPT_ID')) {
              try {
                const scriptUrl = `https://script.google.com/macros/s/${scriptId}/exec?action=getSheetData&gid=${sheet.gid}`
                const response = await fetch(scriptUrl, { method: 'GET', mode: 'cors' })
                if (response.ok) {
                  const data = await response.json()
                  if (data.success && data.csv) {
                    csvText = data.csv
                  }
                }
              } catch (error) {
                // Продолжаем к CSV fallback
              }
            }
            
            // Fallback к CSV экспорту
            if (!csvText) {
              try {
                const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheet.gid}`
                const response = await fetch(csvUrl, { redirect: 'follow', credentials: 'omit' })
                if (response.ok && response.status === 200) {
                  const arrayBuffer = await response.arrayBuffer()
                  const decoder = new TextDecoder('utf-8')
                  csvText = decoder.decode(arrayBuffer)
                }
              } catch (error) {
                continue
              }
            }
            
            if (!csvText) continue
            
            const lines = csvText.split('\n').filter(line => line.trim())
            // Проверяем первые строки на наличие заголовков турниров
            for (let i = 0; i < Math.min(5, lines.length); i++) {
              const line = lines[i].trim().toLowerCase()
              if (line.includes('id') && line.includes('name') && 
                  (line.includes('startdate') || line.includes('enddate') || 
                   line.includes('description') || line.includes('createdat'))) {
                // Проверяем, что это не лист турнира (нет секций TEAMS/GAMES)
                if (!csvText.includes('TEAMS') && !csvText.includes('GAMES') && !csvText.includes('STANDINGS')) {
                  targetGid = sheet.gid
                  break
                }
              }
            }
            
            if (targetGid !== null) {
              break
            }
          } catch (error) {
            // Продолжаем проверку следующего листа
            continue
          }
        }
      }
    }
    
    // Шаг 2: Если нашли лист, загружаем данные (сначала через Apps Script, потом CSV fallback)
    if (targetGid !== null) {
      const scriptId = getGoogleAppsScriptId()
      let csvText = ''
      
      // Способ 1: Пробуем через Google Apps Script
      if (scriptId && !scriptId.includes('YOUR_SCRIPT_ID')) {
        try {
          const scriptUrl = `https://script.google.com/macros/s/${scriptId}/exec?action=getSheetData&gid=${targetGid}`
          const response = await fetch(scriptUrl, {
            method: 'GET',
            mode: 'cors'
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.csv) {
              csvText = data.csv
            }
          }
        } catch (error) {
          // Продолжаем к fallback
        }
      }
      
      // Способ 2: Fallback к CSV экспорту
      if (!csvText) {
        try {
          const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${targetGid}`
          const response = await fetch(csvUrl, {
            redirect: 'follow',
            credentials: 'omit'
          })
          
          if (response.ok && response.status === 200) {
            const arrayBuffer = await response.arrayBuffer()
            const decoder = new TextDecoder('utf-8')
            csvText = decoder.decode(arrayBuffer)
          } else {
            console.warn('⚠️ [loadTournamentsList] Не удалось загрузить данные:', response.status)
            return tournaments
          }
        } catch (error) {
          console.warn('⚠️ [loadTournamentsList] Ошибка при загрузке данных:', error.message)
          return tournaments
        }
      }
      
      if (!csvText) {
        return tournaments
      }
      
      const lines = csvText.split('\n').filter(line => line.trim())
      
      console.log('📄 [loadTournamentsList] CSV данные (первые 20 строк):', lines.slice(0, 20))
      console.log('📄 [loadTournamentsList] Всего строк в CSV:', lines.length)
      console.log('📄 [loadTournamentsList] Полный CSV текст (первые 500 символов):', csvText.substring(0, 500))
      
      if (lines.length === 0) {
        console.log('⚠️ [loadTournamentsList] CSV пустой, возвращаем пустой массив')
        return tournaments
      }
      
      let isTournamentsSection = false
      let headerFound = false
      let headerIndex = -1
        
        // Ищем лист "Tournaments" по характерным признакам:
        // 1. Заголовки: id, name, startDate, endDate, description, createdAt
        // 2. НЕТ секций TEAMS, GAMES, STANDINGS (это отличает от листов турниров)
        // 3. Первая строка должна быть заголовком с id и name
        // 4. Данные должны начинаться сразу после заголовка (без секций TEAMS/GAMES)
        
        // Проверяем первые несколько строк на наличие заголовков турниров
        for (let i = 0; i < Math.min(15, lines.length); i++) {
          const line = lines[i].trim()
          
          // Пропускаем пустые строки
          if (!line) continue
          
          const values = parseCSVLine(line)
          
          // Если видим секции TEAMS, GAMES, STANDINGS - это НЕ лист "Tournaments"
          if (line.includes('TEAMS') || line.includes('GAMES') || line.includes('STANDINGS') ||
              line.includes('Команды') || line.includes('Игры') || line.includes('Турнирная таблица')) {
            // Это лист турнира, а не список турниров - пропускаем
            break
          }
          
          // Проверяем, является ли это заголовком турниров из листа "Tournaments"
          // Вариант 1: Полный набор заголовков (id, name, startDate, endDate, description, createdAt)
          if (line.toLowerCase().includes('id') && 
              line.toLowerCase().includes('name') && 
              (line.toLowerCase().includes('startdate') || 
               line.toLowerCase().includes('enddate') || 
               line.toLowerCase().includes('description') || 
               line.toLowerCase().includes('createdat'))) {
            // Проверяем, что это именно заголовок (id и name в первых двух колонках)
            if (values.length >= 2 && 
                (values[0].trim().toLowerCase() === 'id') &&
                (values[1].trim().toLowerCase() === 'name')) {
              isTournamentsSection = true
              headerFound = true
              headerIndex = i
              console.log('✅ [loadTournamentsList] Найден заголовок турниров на строке:', i, 'Содержимое:', line)
              break
            }
          }
           
          // Вариант 2: Упрощенный вариант - если есть id и name в первых двух колонках
          // И это не секция TEAMS или GAMES (уже проверили выше)
          if (values.length >= 2 && 
              (values[0].trim().toLowerCase() === 'id') &&
              (values[1].trim().toLowerCase() === 'name')) {
            // Дополнительная проверка: если в строке есть startDate, endDate, description или createdAt - точно турниры
            if (line.toLowerCase().includes('startdate') || 
                line.toLowerCase().includes('enddate') || 
                line.toLowerCase().includes('description') || 
                line.toLowerCase().includes('createdat')) {
              isTournamentsSection = true
              headerFound = true
              headerIndex = i
              break
            }
            // Если нет других полей, но есть хотя бы 4 колонки - возможно это турниры
            // Также проверяем следующую строку - если там длинный ID (не число), это турниры
            if (values.length >= 4 || (i + 1 < lines.length && lines[i + 1].trim())) {
              const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
              if (nextLine) {
                const nextValues = parseCSVLine(nextLine)
                if (nextValues.length >= 2 && nextValues[0] && nextValues[0].trim()) {
                  const nextId = nextValues[0].trim()
                  // Если следующий ID длинный (больше 3 символов) или содержит буквы - это турнир
                  // И проверяем, что следующая строка не является секцией TEAMS/GAMES
                  if (!nextLine.includes('TEAMS') && !nextLine.includes('GAMES') && 
                      !nextLine.includes('STANDINGS') &&
                      (nextId.length > 3 || (nextId.length > 0 && isNaN(nextId)))) {
                    isTournamentsSection = true
                    headerFound = true
                    headerIndex = i
                    break
                  }
                }
              } else if (values.length >= 4) {
                // Если следующей строки нет, но есть 4+ колонки, считаем что это турниры
                isTournamentsSection = true
                headerFound = true
                headerIndex = i
                break
              }
            }
          }
        }
        
        // Если нашли заголовки, парсим данные (только один раз!)
        if (isTournamentsSection && headerFound) {
          console.log('📝 [loadTournamentsList] Начинаем парсинг данных турниров, заголовок на строке:', headerIndex)
          const seenIds = new Set() // Для отслеживания уникальности ID
          
          for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim()
            
            // Если видим другую секцию (TEAMS, GAMES, STANDINGS), прекращаем парсинг
            if (line.includes('TEAMS') || line.includes('GAMES') || line.includes('STANDINGS') || 
                line.includes('Команды') || line.includes('Игры') || line.includes('Турнирная таблица')) {
              console.log('🛑 [loadTournamentsList] Обнаружена другая секция, прекращаем парсинг на строке:', i)
              break
            }
            
            if (line && line.trim()) {
              const values = parseCSVLine(line)
              console.log('🔍 [loadTournamentsList] Парсим строку', i, ':', line, '→ значения:', values)
              
              // Ожидаем: id, name, startDate, endDate, description, createdAt
              // Проверяем, что это не заголовок и есть хотя бы id и name
              if (values.length >= 2 && 
                  values[0] && values[0].trim() && 
                  values[0].trim() !== 'id' && 
                  values[0].trim() !== 'name') {
                
                // Проверяем, что это не заголовок другой секции
                if (values[0].trim().includes('TEAMS') || 
                    values[0].trim().includes('GAMES') || 
                    values[0].trim().includes('STANDINGS')) {
                  break
                }
                
                // Проверяем, что ID турнира не является числом команды
                // ID турнира обычно длиннее (например, mj5l4l06jjqkhrwpr) или это не просто число
                const tournamentId = String(values[0].trim())
                const tournamentName = String(values[1] || '').trim()
                
                // Если ID - это короткое число (1-2 цифры), это скорее всего команда, а не турнир
                // ID турнира обычно длиннее или содержит буквы
                if (tournamentId.length <= 2 && !isNaN(tournamentId)) {
                  // Это может быть команда, пропускаем
                  continue
                }
                
                // Если имя пустое, пропускаем
                if (!tournamentName || tournamentName.trim() === '') {
                  continue
                }
                
                // Проверяем уникальность ID, чтобы избежать дублирования
                if (seenIds.has(tournamentId)) {
                  console.log('⚠️ [loadTournamentsList] Дубликат ID пропущен:', tournamentId)
                  continue
                }
                seenIds.add(tournamentId)
                
                const tournamentObj = {
                  id: tournamentId,
                  name: tournamentName,
                  startDate: values[2] ? String(values[2]).trim() : '',
                  endDate: values[3] ? String(values[3]).trim() : '',
                  description: values[4] ? String(values[4]).trim() : '',
                  createdAt: values[5] ? String(values[5]).trim() : new Date().toISOString()
                }
                
                console.log('✅ [loadTournamentsList] Добавлен турнир:', tournamentObj)
                tournaments.push(tournamentObj)
              }
            }
          }
          
          // Если нашли турниры через основной метод, возвращаем результат сразу
          // Не выполняем fallback метод
          if (tournaments.length > 0) {
            console.log('🎉 [loadTournamentsList] Найдено турниров через основной метод:', tournaments.length)
            console.log('📦 [loadTournamentsList] Все турниры:', tournaments)
            return tournaments
          }
        }
    } else {
      // Если не удалось получить список листов через Google Apps Script, возвращаем пустой массив
      // (без списка листов мы не можем найти лист "Tournaments")
      console.warn('⚠️ [loadTournamentsList] Не удалось получить список листов, невозможно загрузить турниры')
    }
    
    console.log('📊 [loadTournamentsList] Итоговый результат:', tournaments)
    console.log('📊 [loadTournamentsList] Количество турниров:', tournaments.length)
    console.log('📊 [loadTournamentsList] Детали каждого турнира:')
    tournaments.forEach((tournament, index) => {
      console.log(`  ${index + 1}.`, JSON.stringify(tournament, null, 2))
    })
    return tournaments
  } catch (error) {
    console.error('❌ [loadTournamentsList] Ошибка загрузки списка турниров:', error)
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
    const scriptId = getGoogleAppsScriptId()
    const scriptUrl = `https://script.google.com/macros/s/${scriptId}/exec`
    
    if (scriptId.includes('YOUR_SCRIPT_ID') || !scriptId) {
      return { success: false, tournamentId: null, error: 'Google Apps Script не настроен' }
    }
    
    // Генерируем уникальный ID для турнира
    const tournamentId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    
    const data = {
      action: 'createTournament',
      tournament: {
        id: tournamentId,
        name: tournamentData.name,
        startDate: tournamentData.startDate || '',
        endDate: tournamentData.endDate || '',
        description: tournamentData.description || '',
        createdAt: new Date().toISOString()
      }
    }
    
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      // В режиме no-cors невозможно проверить успешность запроса напрямую
      // Предполагаем успех, если запрос отправлен
      return { success: true, tournamentId, error: null }
    } catch (error) {
      return { success: false, tournamentId: null, error: error.message }
    }
  } catch (error) {
    return { success: false, tournamentId: null, error: error.message }
  }
}

/**
 * Удаляет турнир из Google Sheets
 * @param {string} tournamentId - ID турнира для удаления
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function deleteTournament(tournamentId) {
  try {
    const scriptId = getGoogleAppsScriptId()
    const scriptUrl = `https://script.google.com/macros/s/${scriptId}/exec`
    
    if (scriptId.includes('YOUR_SCRIPT_ID') || !scriptId) {
      return { success: false, error: 'Google Apps Script не настроен' }
    }
    
    if (!tournamentId) {
      return { success: false, error: 'ID турнира не указан' }
    }
    
    const data = {
      action: 'deleteTournament',
      tournamentId: tournamentId
    }
    
    console.log('🗑️ [deleteTournament] Отправка запроса на удаление турнира:', tournamentId)
    
    try {
      // Используем no-cors mode, так как Google Apps Script не поддерживает CORS
      // В этом режиме невозможно проверить успешность запроса напрямую
      // Предполагаем успех, если запрос отправлен без ошибок
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      // В режиме no-cors невозможно проверить успешность запроса напрямую
      // Предполагаем успех, если запрос отправлен
      // Фактическую проверку удаления делаем через синхронизацию списка турниров
      console.log('✅ [deleteTournament] Запрос на удаление отправлен:', tournamentId)
      return { success: true, error: null }
    } catch (error) {
      console.error('❌ [deleteTournament] Ошибка при отправке запроса:', error)
      return { success: false, error: error.message || 'Ошибка при удалении турнира' }
    }
  } catch (error) {
    console.error('❌ [deleteTournament] Общая ошибка:', error)
    return { success: false, error: error.message || 'Неизвестная ошибка' }
  }
}

