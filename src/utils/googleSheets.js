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
      
      // Пропускаем заголовки
      if (skipHeader && (line.includes('id') || line.includes('name'))) {
        skipHeader = false
        continue
      }
      skipHeader = false
      
      if (isTeamsSection && line && !line.includes('id')) {
        const values = parseCSVLine(line)
        if (values.length >= 4 && values[0] && !isNaN(values[0])) {
          teams.push({
            id: parseInt(values[0]),
            name: values[1] || '',
            logo: values[2] || '🏒',
            color: values[3] || '#1e3c72'
          })
        }
      }
      
      if (isGamesSection && line && !line.includes('id')) {
        const values = parseCSVLine(line)
        if (values.length >= 7 && values[0] && !isNaN(values[0])) {
          games.push({
            id: parseInt(values[0]),
            homeTeamId: parseInt(values[1]) || 0,
            awayTeamId: parseInt(values[2]) || 0,
            homeScore: parseInt(values[3]) || 0,
            awayScore: parseInt(values[4]) || 0,
            gameType: values[5] || 'regular',
            date: values[6] || new Date().toLocaleDateString('ru-RU')
          })
        }
      }
    }
    
    console.log('Данные загружены из Google Sheets:', { teamsCount: teams.length, gamesCount: games.length })
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
export async function saveDataToSheets(teams, games) {
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
      }))
    }
    
    // Используем Google Apps Script Web App URL
    // Нужно создать скрипт и опубликовать его как Web App
    // Инструкция в файле GOOGLE_SHEETS_SETUP.md
    const scriptUrl = `https://script.google.com/macros/s/AKfycbyDbDL7qtKt4ruL_A5KM75AeBcnvFS4MmEfM4OC_5uFXe6iZotxGhu7CZopm2x2Qzk-/exec`
    
    // Если URL не настроен
    if (scriptUrl.includes('YOUR_SCRIPT_ID')) {
      console.log('Для синхронизации с Google Sheets настройте Google Apps Script (см. GOOGLE_SHEETS_SETUP.md)')
      return false
    }
    
    // Попытка отправить через Google Apps Script
    console.log('Отправка данных в Google Sheets...', { teamsCount: teams.length, gamesCount: games.length })
    
    try {
      // Сначала пытаемся использовать cors режим для проверки ответа
      try {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          mode: 'cors', // Используем cors для возможности проверки ответа
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
        
        // Проверяем статус ответа
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        // Пытаемся прочитать JSON ответ
        try {
          const result = await response.json()
          if (result.success) {
            console.log('✅ Данные успешно сохранены в Google Sheets')
            return true
          } else {
            console.error('❌ Ошибка сохранения данных:', result.error || 'Неизвестная ошибка')
            return false
          }
        } catch (parseError) {
          // Если ответ не JSON, но статус OK, считаем успешным
          const text = await response.text()
          console.log('✅ Данные отправлены в Google Sheets')
          return true
        }
      } catch (corsError) {
        // Если CORS не работает, пробуем no-cors режим (fallback)
        if (corsError.name === 'TypeError' && corsError.message.includes('Failed to fetch')) {
          console.warn('⚠️ CORS режим не поддерживается, используем no-cors режим (ответ не будет проверен)')
          
          await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          })
          
          console.log('✅ Запрос отправлен в Google Sheets (режим no-cors)')
          console.log('Примечание: Проверьте таблицу через несколько секунд для подтверждения сохранения.')
          return true
        } else {
          throw corsError
        }
      }
    } catch (error) {
      console.error('❌ Ошибка отправки данных в Google Sheets:', error)
      console.log('Возможные причины:')
      console.log('1. Google Apps Script не настроен как Web App с доступом "Все, включая анонимных"')
      console.log('2. Web App не переопубликован после изменений в скрипте')
      console.log('3. Проверьте, что в настройках Web App выбрано "Выполнять от имени: Меня"')
      console.log('4. Убедитесь, что скрипт обрабатывает JSON данные правильно')
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

