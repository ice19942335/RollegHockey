export const translations = {
  ru: {
    // Header
    headerTitle: '🏒 Турнирная таблица по хоккею',
    headerSubtitle: 'Управление командами, играми и результатами турнира',
    
    // Team Form
    teamNamePlaceholder: 'Название команды',
    selectLogo: 'Выберите логотип:',
    selectColor: 'Выберите цвет команды:',
    addTeam: 'Добавить команду',
    addTeamSection: 'Добавить команду',
    teamsList: 'Команды',
    clickToEdit: 'Кликните для редактирования',
    
    // Game Form
    addGameSection: 'Добавить игру',
    selectHomeTeam: 'Выберите домашнюю команду',
    selectAwayTeam: 'Выберите гостевую команду',
    openScoreboard: '📺 Открыть табло',
    addGame: 'Добавить игру',
    gameTypeRegular: 'Основное время',
    gameTypeShootout: 'Буллиты',
    
    // Standings Table
    standingsTitle: 'Турнирная таблица',
    teamColumn: 'Команда',
    gamesColumn: 'И',
    winsRegularColumn: 'ПО',
    winsShootoutColumn: 'ПБ',
    lossesRegularColumn: 'ПОВ',
    lossesShootoutColumn: 'ППБ',
    goalsForColumn: 'ЗГ',
    goalsAgainstColumn: 'ПГ',
    goalDiffColumn: '±',
    pointsColumn: 'О',
    legend: 'Легенда:',
    legendGames: 'И - Игры',
    legendWinsRegular: 'ПО - Победы в основное время',
    legendWinsShootout: 'ПБ - Победы в буллитах',
    legendLossesRegular: 'ПОВ - Поражения основное время',
    legendLossesShootout: 'ППБ - Поражения по буллитам',
    legendGoalsFor: 'ЗГ - Забитые голы',
    legendGoalsAgainst: 'ПГ - Пропущенные голы',
    legendGoalDiff: '± - Разница голов',
    legendPoints: 'О - Очки',
    scoringSystem: 'Система очков:',
    scoringWinRegular: 'Победа в основное время - 3 очка',
    scoringWinShootout: 'Победа в буллитах - 2 очка',
    scoringDrawRegular: 'Ничья в основное время - 1 очко',
    scoringDrawShootout: 'Ничья в буллитах - 1 очко',
    scoringLoss: 'Поражение - 0 очков',
    
    // Games List
    gamesTitle: 'Игры',
    deleteAllGames: '🗑️ Удалить все игры',
    
    // Scoreboard
    team1: 'Команда 1',
    team2: 'Команда 2',
    
    // Modals
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    delete: 'Удалить',
    deleteTeamTitle: 'Удалить команду "{name}"?',
    deleteTeamConfirm: 'Вы уверены, что хотите удалить эту команду?',
    deleteTeamWithGames: 'Эта команда участвует в {count} {gamesWord}. При удалении команды все связанные игры также будут удалены.',
    game: 'игре',
    games: 'играх',
    relatedGames: 'Связанные игры:',
    deleteTeamWarning: 'Вы уверены, что хотите удалить команду и все связанные игры?',
    missingTeamsTitle: 'Команды не найдены',
    missingTeamsMessage: 'После синхронизации с Google Sheets обнаружено, что следующие команды отсутствуют в данных:',
    missingTeamsAction: 'Вы можете создать эти команды заново и сохранить их вместе с игрой, либо отменить операцию.',
    cancelAction: 'Отменить',
    createTeamsAndSave: 'Создать команды и сохранить',
    deleteAllGamesTitle: 'Удалить все игры?',
    deleteAllGamesMessage: 'Вы уверены, что хотите удалить все {count} игр? Это действие нельзя отменить.',
    
    // Loading & Saving
    loading: 'Загрузка данных...',
    saving: 'Сохранение, подождите +-15 секунд...',
    elapsed: 'Прошло: {seconds} сек.',
  },
  lv: {
    // Header
    headerTitle: '🏒 Hokeja turnīra tabula',
    headerSubtitle: 'Komandu, spēļu un turnīra rezultātu pārvaldība',
    
    // Team Form
    teamNamePlaceholder: 'Komandas nosaukums',
    selectLogo: 'Izvēlieties logo:',
    selectColor: 'Izvēlieties komandas krāsu:',
    addTeam: 'Pievienot komandu',
    addTeamSection: 'Pievienot komandu',
    teamsList: 'Komandas',
    clickToEdit: 'Noklikšķiniet, lai rediģētu',
    
    // Game Form
    addGameSection: 'Pievienot spēli',
    selectHomeTeam: 'Izvēlieties mājas komandu',
    selectAwayTeam: 'Izvēlieties viesu komandu',
    openScoreboard: '📺 Atvērt rezultātu tablo',
    addGame: 'Pievienot spēli',
    gameTypeRegular: 'Pamata laiks',
    gameTypeShootout: 'Bulle',
    
    // Standings Table
    standingsTitle: 'Turnīra tabula',
    teamColumn: 'Komanda',
    gamesColumn: 'S',
    winsRegularColumn: 'UO',
    winsShootoutColumn: 'UB',
    lossesRegularColumn: 'ZO',
    lossesShootoutColumn: 'ZB',
    goalsForColumn: 'VG',
    goalsAgainstColumn: 'PG',
    goalDiffColumn: '±',
    pointsColumn: 'P',
    legend: 'Leģenda:',
    legendGames: 'S - Spēles',
    legendWinsRegular: 'UO - Uzvaras pamata laikā',
    legendWinsShootout: 'UB - Uzvaras bullē',
    legendLossesRegular: 'ZO - Zaudējumi pamata laikā',
    legendLossesShootout: 'ZB - Zaudējumi bullē',
    legendGoalsFor: 'VG - Vārti guvumā',
    legendGoalsAgainst: 'PG - Pretinieka vārti',
    legendGoalDiff: '± - Vārtu starpība',
    legendPoints: 'P - Punkti',
    scoringSystem: 'Punktu sistēma:',
    scoringWinRegular: 'Uzvara pamata laikā - 3 punkti',
    scoringWinShootout: 'Uzvara bullē - 2 punkti',
    scoringDrawRegular: 'Neizšķirts pamata laikā - 1 punkts',
    scoringDrawShootout: 'Neizšķirts bullē - 1 punkts',
    scoringLoss: 'Zaudējums - 0 punkti',
    
    // Games List
    gamesTitle: 'Spēles',
    deleteAllGames: '🗑️ Dzēst visas spēles',
    
    // Scoreboard
    team1: 'Komanda 1',
    team2: 'Komanda 2',
    
    // Modals
    cancel: 'Atcelt',
    confirm: 'Apstiprināt',
    delete: 'Dzēst',
    deleteTeamTitle: 'Dzēst komandu "{name}"?',
    deleteTeamConfirm: 'Vai tiešām vēlaties dzēst šo komandu?',
    deleteTeamWithGames: 'Šī komanda piedalās {count} {gamesWord}. Dzēšot komandu, visas saistītās spēles arī tiks dzēstas.',
    game: 'spēlē',
    games: 'spēlēs',
    relatedGames: 'Saistītās spēles:',
    deleteTeamWarning: 'Vai tiešām vēlaties dzēst komandu un visas saistītās spēles?',
    missingTeamsTitle: 'Komandas nav atrastas',
    missingTeamsMessage: 'Pēc sinhronizācijas ar Google Sheets tika konstatēts, ka šādas komandas nav datu bāzē:',
    missingTeamsAction: 'Jūs varat izveidot šīs komandas no jauna un saglabāt tās kopā ar spēli, vai arī atcelt darbību.',
    cancelAction: 'Atcelt',
    createTeamsAndSave: 'Izveidot komandas un saglabāt',
    deleteAllGamesTitle: 'Dzēst visas spēles?',
    deleteAllGamesMessage: 'Vai tiešām vēlaties dzēst visas {count} spēles? Šo darbību nevar atsaukt.',
    
    // Loading & Saving
    loading: 'Datu ielāde...',
    saving: 'Saglabāšana, lūdzu, uzgaidiet +-15 sekundes...',
    elapsed: 'Pagājis: {seconds} sek.',
  }
}

