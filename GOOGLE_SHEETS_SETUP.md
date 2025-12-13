# Настройка синхронизации с Google Sheets

## Текущая реализация

Приложение использует:
- **Чтение данных**: Публичный CSV экспорт из Google Sheets
- **Запись данных**: Требуется настройка Google Apps Script

## Настройка Google Apps Script для записи данных

### Шаг 1: Создание скрипта

1. Откройте вашу Google таблицу: https://docs.google.com/spreadsheets/d/155dQ0YN-WUNGcxRr_IxcJkN_v2gphA0s6c4uR1nExkg/edit
2. Перейдите в `Расширения` → `Apps Script`
3. Вставьте следующий код:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    
    // Создаем отдельный лист для логов (или используем Sheet2)
    let logSheet;
    try {
      logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
      if (!logSheet) {
        logSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Logs');
        logSheet.appendRow(['Время', 'Событие', 'Детали']);
      }
    } catch (logError) {
      // Если не удалось создать лист для логов, продолжаем без логирования
    }
    
    // Функция для записи лога в таблицу
    function writeLog(event, details) {
      if (logSheet) {
        try {
          logSheet.appendRow([new Date(), event, details]);
        } catch (e) {
          // Игнорируем ошибки логирования
        }
      }
    }
    
    writeLog('doPost вызван', 'Начало выполнения');
    writeLog('Проверка данных', 'e.postData: ' + (e.postData ? 'есть' : 'нет'));
    
    // Получаем данные из запроса
    // Google Apps Script автоматически парсит JSON из e.postData.contents
    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
        const teamsCount = data.teams ? data.teams.length : 0;
        const gamesCount = data.games ? data.games.length : 0;
        writeLog('Данные распарсены', 'Teams: ' + teamsCount + ', Games: ' + gamesCount);
      } catch (parseError) {
        writeLog('ОШИБКА парсинга', parseError.toString());
        // Если не удалось распарсить, возможно данные уже объект
        data = e.postData.contents;
      }
    } else {
      writeLog('ОШИБКА', 'Нет данных в запросе');
      throw new Error('Нет данных в запросе');
    }
    
    // Проверяем наличие данных
    if (!data) {
      writeLog('ОШИБКА', 'Данные пусты');
      throw new Error('Данные пусты');
    }
    
    writeLog('Начало записи', 'Очистка таблицы...');
    
    // Полностью очищаем лист перед записью новых данных
    // Удаляем все данные и форматирование
    const lastRow = sheet.getLastRow();
    if (lastRow > 0) {
      // Удаляем все строки с данными
      sheet.deleteRows(1, lastRow);
    }
    // Очищаем форматирование (на случай если остались пустые строки)
    sheet.clearFormats();
    
    // Записываем команды
    writeLog('Запись команд', 'Начало');
    sheet.appendRow(['TEAMS']);
    sheet.appendRow(['id', 'name', 'logo', 'color']);
    if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
      writeLog('Команды', 'Количество: ' + data.teams.length);
      data.teams.forEach(team => {
        try {
          sheet.appendRow([
            team.id || '',
            team.name || '',
            team.logo || '',
            team.color || ''
          ]);
        } catch (teamError) {
          writeLog('Ошибка команды', teamError.toString());
        }
      });
      writeLog('Команды', 'Записано успешно');
    } else {
      writeLog('Команды', 'Отсутствуют или пусты');
    }
    
    // Пустая строка (нельзя использовать пустой массив)
    sheet.appendRow(['']);
    
    // Записываем игры
    writeLog('Запись игр', 'Начало');
    sheet.appendRow(['GAMES']);
    sheet.appendRow(['id', 'homeTeamId', 'awayTeamId', 'homeScore', 'awayScore', 'gameType', 'date']);
    if (data.games && Array.isArray(data.games) && data.games.length > 0) {
      writeLog('Игры', 'Количество: ' + data.games.length);
      data.games.forEach(game => {
        try {
          writeLog('Игра', 'ID: ' + game.id + ', Home: ' + game.homeTeamId + ', Away: ' + game.awayTeamId);
          sheet.appendRow([
            game.id || '',
            game.homeTeamId || '',
            game.awayTeamId || '',
            game.homeScore || 0,
            game.awayScore || 0,
            game.gameType || 'regular',
            game.date || ''
          ]);
          writeLog('Игра', 'Записана: ' + game.id);
        } catch (gameError) {
          writeLog('Ошибка игры', gameError.toString());
        }
      });
      writeLog('Игры', 'Записано успешно');
    } else {
      writeLog('Игры', 'Отсутствуют. Количество: ' + (data.games ? data.games.length : 'null'));
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
    
    writeLog('Успех', 'Данные записаны в таблицу');
    
    // Возвращаем успешный ответ с CORS заголовками
    const output = ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
    
    // Добавляем CORS заголовки для возможности проверки ответа
    // В Google Apps Script это делается через специальный формат ответа
    return output;
  } catch (error) {
    // Пытаемся записать ошибку в лог
    try {
      const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logs');
      if (logSheet) {
        logSheet.appendRow([new Date(), 'ОШИБКА', error.toString() + ' | Стек: ' + (error.stack || 'нет')]);
      }
    } catch (logError) {
      // Игнорируем ошибки логирования
    }
    
    // Возвращаем ошибку с CORS заголовками
    const output = ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

function doGet(e) {
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

Таблица должна иметь следующую структуру:

### Секция TEAMS:
```
TEAMS
id | name | logo | color
1  | Команда Миши | 🏒 | #1e3c72
```

### Секция GAMES:
```
GAMES
id | homeTeamId | awayTeamId | homeScore | awayScore | gameType | date
1  | 1          | 2          | 3         | 2         | regular  | 13.12.2025
```

## Альтернативный вариант: Использование только чтения

Если вы хотите использовать только чтение данных (без записи), приложение будет:
- Загружать данные из таблицы при старте
- Не синхронизировать изменения обратно в таблицу

## Примечания

- Для записи данных требуется, чтобы таблица была доступна для редактирования через Google Apps Script
- Рекомендуется настроить права доступа к таблице соответствующим образом
- При первом запуске скрипта Google может запросить разрешения на доступ к таблице

