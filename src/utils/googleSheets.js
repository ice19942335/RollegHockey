// Google Sheets API утилиты
const SPREADSHEET_ID = '155dQ0YN-WUNGcxRr_IxcJkN_v2gphA0s6c4uR1nExkg'
// Для записи нужен API ключ с правами на запись или Google Apps Script
// Для чтения используем публичный CSV экспорт

/**
 * Загружает данные из Google Sheets
 */
export async function loadDataFromSheets() {
  try {
    // Используем публичный CSV экспорт
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`
    
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error('Не удалось загрузить данные из таблицы')
    }
    
    const csvText = await response.text()
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
      
      if (line === 'TEAMS' || line === 'Команды' || line.includes('TEAMS') || line.includes('Команды')) {
        isTeamsSection = true
        isGamesSection = false
        skipHeader = true
        continue
      }
      
      if (line === 'GAMES' || line === 'Игры' || line.includes('GAMES') || line.includes('Игры')) {
        isTeamsSection = false
        isGamesSection = true
        skipHeader = true
        continue
      }
      
      // Если видим заголовок с homeTeamId, это начало секции GAMES (даже если нет явной строки "GAMES")
      if (line.includes('homeTeamId') && line.includes('awayTeamId')) {
        isTeamsSection = false
        isGamesSection = true
        skipHeader = false // Заголовок уже найден, пропустим его в следующей проверке
        continue
      }
      
      // Обрабатываем секцию STANDINGS - отключаем парсинг игр
      if (line === 'STANDINGS' || line === 'Турнирная таблица' || (line.includes('STANDINGS') && !line.includes('id')) || (line.includes('teamId') && line.includes('teamName') && line.includes('gamesPlayed'))) {
        isTeamsSection = false
        isGamesSection = false // Отключаем парсинг игр, так как началась секция standings
        skipHeader = true
        continue
      }
      
      // Пропускаем заголовки для команд
      if (skipHeader && isTeamsSection && (line.includes('id') || line.includes('name'))) {
        skipHeader = false
        continue
      }
      
      // Пропускаем заголовки для игр
      if (skipHeader && isGamesSection && (line.includes('id') && line.includes('homeTeamId'))) {
        skipHeader = false
        console.log('Пропущен заголовок игр:', line)
        continue
      }
      
      skipHeader = false
      
      if (isTeamsSection && line && !line.includes('id') && !line.includes('name') && line.trim()) {
        const values = parseCSVLine(line)
        // Проверяем, что это действительно строка с данными команды (не заголовок)
        // values[0] должен быть ID (не пустой и не "id"), values[1] должен быть названием (не пустым и не "name")
        if (values.length >= 4 && 
            values[0] && values[0].trim() && values[0].trim() !== 'id' && 
            values[1] && values[1].trim() && values[1].trim() !== 'name') {
          // Используем Number() вместо parseInt() для сохранения точности больших чисел
          // И преобразуем в строку для единообразия
          const teamId = String(values[0].trim())
          const teamName = String(values[1].trim())
          
          // Проверяем, что название не является числом (это может быть ошибка парсинга)
          if (isNaN(Number(teamName)) && teamName.length > 0) {
            // Проверяем на дубликаты
            if (!teamIds.has(teamId)) {
              teamIds.add(teamId)
              teams.push({
                id: teamId, // Сохраняем как строку для избежания проблем с точностью
                name: teamName,
                logo: (values[2] || '🏒').trim(),
                color: (values[3] || '#1e3c72').trim()
              })
            }
          }
        }
      }

      if (isGamesSection && line && line.trim()) {
        
        // Пропускаем заголовки (строка должна содержать и "id" и "homeTeamId")
        if (line.includes('homeTeamId') && line.includes('id')) {
          continue
        }
        
        const values = parseCSVLine(line)
        
        // Проверяем, что это действительно строка с данными игры
        // Должно быть минимум 7 полей, и первые три не должны быть пустыми
        if (values.length >= 7 && values[0] && values[0].trim() && values[1] && values[1].trim() && values[2] && values[2].trim()) {
          // Дополнительная проверка: убеждаемся, что это не заголовок
          if (values[0].trim() === 'id' || values[1].trim() === 'homeTeamId') {
            continue
          }
          
          const game = {
            id: String(values[0].trim()),
            homeTeamId: String(values[1].trim()),
            awayTeamId: String(values[2].trim()),
            homeScore: parseInt(values[3]) || 0,
            awayScore: parseInt(values[4]) || 0,
            gameType: (values[5] || 'regular').trim(),
            date: (values[6] || new Date().toLocaleDateString('ru-RU')).trim()
          }
          games.push(game)
        }
      }
    }
    
    console.log('Данные загружены из Google Sheets:', { teamsCount: teams.length, gamesCount: games.length })
    console.log('Загруженные команды:', teams.map(t => ({ id: t.id, name: t.name })))
    console.log('Загруженные игры:', games.map(g => ({ id: g.id, homeTeamId: g.homeTeamId, awayTeamId: g.awayTeamId })))
    return { teams, games }
  } catch (error) {
    console.error('Ошибка загрузки данных из Google Sheets:', error)
    return { teams: [], games: [] }
  }
}

/**
 * Сохраняет данные в Google Sheets через Google Apps Script Web App
 * Нужно создать Google Apps Script с функцией doPost для записи данных
 */
export async function saveDataToSheets(teams, games, standings = []) {
  try {
    // Формируем данные для записи
    const data = {
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
        date: game.date
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
    const scriptUrl = `https://script.google.com/macros/s/AKfycbyVQje3ZmAauNAZaox3lru77zgXOEDkgp2H86AD2bGOhbl2hnLMWhg1brWGFJHE940R/exec`
    
    // Если URL не настроен
    if (scriptUrl.includes('YOUR_SCRIPT_ID')) {
      console.log('Для синхронизации с Google Sheets настройте Google Apps Script (см. GOOGLE_SHEETS_SETUP.md)')
      return false
    }
    
    // Попытка отправить через Google Apps Script
    console.log('Отправка данных в Google Sheets...', { 
      teamsCount: teams.length, 
      gamesCount: games.length, 
      standingsCount: standings.length 
    })
    console.log('Данные для отправки:', {
      teams: data.teams.length,
      games: data.games.length,
      standings: data.standings.length,
      gamesData: data.games
    })
    
    // Проверяем URL перед отправкой
    if (!scriptUrl || scriptUrl.includes('YOUR_SCRIPT_ID') || !scriptUrl.includes('script.google.com')) {
      console.error('❌ URL скрипта не настроен или неверный')
      console.log('Проверьте файл src/utils/googleSheets.js и убедитесь, что scriptUrl содержит правильный URL вашего Google Apps Script')
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
      
      console.log('✅ Запрос отправлен в Google Sheets')
      // В режиме no-cors невозможно проверить успешность запроса напрямую,
      // но если данные загружаются из таблицы, значит синхронизация работает
      return true
    } catch (error) {
      console.error('❌ Ошибка отправки данных в Google Sheets:', error)
      console.log('Возможные причины:')
      console.log('1. Google Apps Script не настроен как Web App с доступом "Все, включая анонимных"')
      console.log('2. Web App не переопубликован после изменений в скрипте')
      console.log('3. Проверьте, что в настройках Web App выбрано "Выполнять от имени: Меня"')
      console.log('4. Убедитесь, что скрипт обрабатывает JSON данные правильно')
      console.log('5. Проверьте URL скрипта в файле src/utils/googleSheets.js')
      return false
    }
  } catch (error) {
    console.error('Ошибка сохранения данных:', error)
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
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current.trim())
  return values
}

