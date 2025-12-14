# Настройка синхронизации с Google Sheets

## Текущая реализация

Приложение использует:
- **Чтение данных**: Публичный CSV экспорт из Google Sheets
- **Запись данных**: Требуется настройка Google Apps Script
- **Множественные турниры**: Каждый турнир хранится в отдельном листе с названием `turnament_<id>`
- **Dev/Production режимы**: Конфигурация для переключения между dev и production документами

## Конфигурация Dev/Production режимов

1. Скопируйте `src/config/googleSheets.example.js` в `src/config/googleSheets.js`
2. Заполните конфигурацию:
   - `IS_DEV_MODE`: `true` для разработки, `false` для продакшена
   - `DEV_SPREADSHEET_ID`: ID Google Sheets документа для разработки
   - `DEV_GOOGLE_APPS_SCRIPT_ID`: ID Google Apps Script для разработки
   - `PROD_SPREADSHEET_ID`: ID Google Sheets документа для продакшена
   - `PROD_GOOGLE_APPS_SCRIPT_ID`: ID Google Apps Script для продакшена

**Важно**: Файл `src/config/googleSheets.js` добавлен в `.gitignore` и не будет попадать в git.

## Настройка Google Apps Script для записи данных

### Шаг 1: Создание скрипта

1. Откройте вашу Google таблицу: https://docs.google.com/spreadsheets/d/155dQ0YN-WUNGcxRr_IxcJkN_v2gphA0s6c4uR1nExkg/edit
2. Перейдите в `Расширения` → `Apps Script`
3. Вставьте следующий код:

```javascript
// Функция для получения или создания листа
function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    // Создаем новый лист с точным названием
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  return sheet;
}

// Функция для создания турнира
function createTournamentSheet(tournamentId, tournamentData) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = `turnament_${tournamentId}`;
  
  // Проверяем, существует ли уже лист
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (sheet) {
    // Лист уже существует
    return { success: false, error: 'Tournament sheet already exists' };
  }
  
  // Создаем новый лист с точным названием
  sheet = spreadsheet.insertSheet(sheetName);
  
  // Инициализируем пустой лист (можно добавить заголовки)
  sheet.appendRow(['TEAMS']);
  sheet.appendRow(['id', 'name', 'logo', 'color']);
  sheet.appendRow(['']);
  sheet.appendRow(['GAMES']);
  sheet.appendRow(['id', 'homeTeamId', 'awayTeamId', 'homeScore', 'awayScore', 'gameType', 'date']);
  
  // Обновляем лист "Tournaments" если он существует
  let tournamentsSheet = spreadsheet.getSheetByName('Tournaments');
  if (!tournamentsSheet) {
    tournamentsSheet = spreadsheet.insertSheet('Tournaments');
    tournamentsSheet.appendRow(['id', 'name', 'startDate', 'endDate', 'description', 'createdAt']);
  }
  
  // Добавляем запись о турнире
  tournamentsSheet.appendRow([
    tournamentData.id,
    tournamentData.name,
    tournamentData.startDate || '',
    tournamentData.endDate || '',
    tournamentData.description || '',
    tournamentData.createdAt || new Date().toISOString()
  ]);
  
  return { success: true };
}

// Функция для удаления турнира
function deleteTournamentSheet(tournamentId) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = `turnament_${tournamentId}`;
  
  try {
    // Удаляем лист турнира, если он существует
    const tournamentSheet = spreadsheet.getSheetByName(sheetName);
    if (tournamentSheet) {
      spreadsheet.deleteSheet(tournamentSheet);
    }
    
    // Удаляем запись из листа "Tournaments"
    const tournamentsSheet = spreadsheet.getSheetByName('Tournaments');
    if (tournamentsSheet) {
      const dataRange = tournamentsSheet.getDataRange();
      const values = dataRange.getValues();
      
      // Ищем строку с нужным tournamentId (первая колонка - id)
      let rowToDelete = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] === tournamentId) {
          rowToDelete = i + 1; // +1 потому что getValues() возвращает индексы с 0, а deleteRow() использует 1-based индексы
          break;
        }
      }
      
      // Удаляем строку, если найдена
      if (rowToDelete > 0) {
        tournamentsSheet.deleteRow(rowToDelete);
      }
    }
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function doPost(e) {
  try {
    // Получаем данные из запроса
    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseError) {
        data = e.postData.contents;
      }
    } else {
      throw new Error('Нет данных в запросе');
    }
    
    // Проверяем наличие данных
    if (!data) {
      throw new Error('Данные пусты');
    }
    
    // Обработка создания турнира
    if (data.action === 'createTournament' && data.tournament) {
      const result = createTournamentSheet(data.tournament.id, data.tournament);
      const output = ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
      return output;
    }
    
    // Обработка удаления турнира
    if (data.action === 'deleteTournament' && data.tournamentId) {
      const result = deleteTournamentSheet(data.tournamentId);
      const output = ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
      return output;
    }
    
    // Определяем, в какой лист записывать данные
    // Если не указан sheetName или tournamentId, выбрасываем ошибку
    let sheetName = null;
    if (data.sheetName) {
      sheetName = data.sheetName;
    } else if (data.tournamentId) {
      sheetName = `turnament_${data.tournamentId}`;
    } else {
      throw new Error('Не указан sheetName или tournamentId');
    }
    
    // Получаем или создаем лист
    const sheet = getOrCreateSheet(sheetName);
    
    // Полностью очищаем лист перед записью новых данных
    const lastRow = sheet.getLastRow();
    if (lastRow > 0) {
      sheet.deleteRows(1, lastRow);
    }
    sheet.clearFormats();
    
    // Записываем команды
    sheet.appendRow(['TEAMS']);
    sheet.appendRow(['id', 'name', 'logo', 'color']);
    if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
      data.teams.forEach(team => {
        try {
          sheet.appendRow([
            team.id || '',
            team.name || '',
            team.logo || '',
            team.color || ''
          ]);
        } catch (teamError) {
          // Игнорируем ошибки записи команды
        }
      });
    }
    
    // Пустая строка (нельзя использовать пустой массив)
    sheet.appendRow(['']);
    
    // Записываем игры
    sheet.appendRow(['GAMES']);
    sheet.appendRow(['id', 'homeTeamId', 'awayTeamId', 'homeScore', 'awayScore', 'gameType', 'date']);
    if (data.games && Array.isArray(data.games) && data.games.length > 0) {
      data.games.forEach(game => {
        try {
          sheet.appendRow([
            game.id || '',
            game.homeTeamId || '',
            game.awayTeamId || '',
            game.homeScore || 0,
            game.awayScore || 0,
            game.gameType || 'regular',
            game.date || ''
          ]);
        } catch (gameError) {
          // Игнорируем ошибки записи игры
        }
      });
    }
    
    // Пустая строка (нельзя использовать пустой массив)
    sheet.appendRow(['']);
    
    // Записываем турнирную таблицу
    sheet.appendRow(['STANDINGS']);
    sheet.appendRow(['position', 'teamId', 'teamName', 'gamesPlayed', 'wins', 'winsOT', 'losses', 'lossesOT', 'goalsFor', 'goalsAgainst', 'goalDifference', 'points']);
    if (data.standings && data.standings.length > 0) {
      data.standings.forEach(standing => {
        sheet.appendRow([
          standing.position,
          standing.teamId,
          standing.teamName,
          standing.gamesPlayed,
          standing.wins,
          standing.winsOT,
          standing.losses,
          standing.lossesOT,
          standing.goalsFor,
          standing.goalsAgainst,
          standing.goalDifference,
          standing.points
        ]);
      });
    }
    
    // Возвращаем успешный ответ с CORS заголовками
    const output = ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Добавляем CORS заголовки для возможности проверки ответа
    // В Google Apps Script это делается через специальный формат ответа
    return output;
  } catch (error) {
    // Возвращаем ошибку с CORS заголовками
    const output = ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

function doGet(e) {
  // Обработка получения списка листов
  if (e.parameter && e.parameter.action === 'getSheetsList') {
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const sheets = spreadsheet.getSheets();
      const sheetsList = sheets.map(sheet => ({
        name: sheet.getName(),
        gid: sheet.getSheetId()
      }));
      
      const output = ContentService.createTextOutput(JSON.stringify({
        success: true,
        sheets: sheetsList
      }))
        .setMimeType(ContentService.MimeType.JSON);
      return output;
    } catch (error) {
      const output = ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
        .setMimeType(ContentService.MimeType.JSON);
      return output;
    }
  }
  
  // Для чтения данных используем публичный CSV экспорт
  return ContentService.createTextOutput('Use CSV export for reading data');
}
```

### Шаг 2: Публикация как Web App

1. Нажмите `Развернуть` → `Новое развертывание`
2. Выберите тип: `Веб-приложение`
3. Настройки:
   - **Описание**: Hockey Tournament Sync
   - **Выполнять от имени**: Меня
   - **У кого есть доступ**: **Все, включая анонимных** (важно!)
4. Нажмите `Развернуть`
5. **ВАЖНО**: При первом развертывании Google запросит разрешения - нажмите "Разрешить"
6. Скопируйте URL веб-приложения
7. **ВАЖНО**: Если вы изменили код скрипта, нужно создать новое развертывание или обновить существующее

### Шаг 3: Обновление URL в коде

1. Откройте файл `src/utils/googleSheets.js`
2. Найдите строку: `const scriptUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'`
3. Замените `YOUR_SCRIPT_ID` на ID из URL вашего веб-приложения

## Структура данных в таблице

### Лист "Tournaments" (список турниров):
```
id | name | startDate | endDate | description | createdAt
abc123 | Зимний турнир 2025 | 2025-01-01 | 2025-01-31 | Описание | 2025-01-01T00:00:00.000Z
```

### Лист "turnament_<id>" (данные турнира):
Каждый турнир хранится в отдельном листе с точным названием `turnament_<id>`, например `turnament_abc123`.

#### Секция TEAMS:
```
TEAMS
id | name | logo | color
1  | Команда Миши | 🏒 | #1e3c72
```

#### Секция GAMES:
```
GAMES
id | homeTeamId | awayTeamId | homeScore | awayScore | gameType | date
1  | 1          | 2          | 3         | 2         | regular  | 13.12.2025
```

**Важно**: Название листа должно быть точно `turnament_<id>` (без дополнительных слов, без пробелов).

## Альтернативный вариант: Использование только чтения

Если вы хотите использовать только чтение данных (без записи), приложение будет:
- Загружать данные из таблицы при старте
- Не синхронизировать изменения обратно в таблицу

## Примечания

- Для записи данных требуется, чтобы таблица была доступна для редактирования через Google Apps Script
- Рекомендуется настроить права доступа к таблице соответствующим образом
- При первом запуске скрипта Google может запросить разрешения на доступ к таблице

