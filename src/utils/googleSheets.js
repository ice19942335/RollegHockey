// Google Sheets API утилиты
const SPREADSHEET_ID = '155dQ0YN-WUNGcxRr_IxcJkN_v2gphA0s6c4uR1nExkg'
// Для записи нужен API ключ с правами на запись или Google Apps Script
// Для чтения используем публичный CSV экспорт

/**
 * Загружает данные из Google Sheets
 */
export async function loadDataFromSheets() {
  try {
    // Используем публичный CSV экспорт с явным указанием кодировки UTF-8
    // Пробуем разные варианты экспорта для поддержки русских символов
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`
    
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error('Не удалось загрузить данные из таблицы')
    }
    
    // Получаем данные как ArrayBuffer для правильной обработки кодировки
    const arrayBuffer = await response.arrayBuffer()
    // Декодируем как UTF-8
    const decoder = new TextDecoder('utf-8')
    const csvText = decoder.decode(arrayBuffer)
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
          // Оставляем первые 7 значений (id, homeTeamId, awayTeamId, homeScore, awayScore, gameType, date) или непустые значения
          return index < 7 || v.trim() !== ''
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
          
          const game = {
            id: String(cleanValues[0].trim()),
            homeTeamId: String(homeTeamId),
            awayTeamId: String(awayTeamId),
            homeScore: parseInt(cleanValues[3]) || 0,
            awayScore: parseInt(cleanValues[4]) || 0,
            gameType: (cleanValues[5] || 'regular').trim(),
            date: (cleanValues[6] || new Date().toLocaleDateString('ru-RU')).trim()
          }
          games.push(game)
        }
      }
    }
    
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

