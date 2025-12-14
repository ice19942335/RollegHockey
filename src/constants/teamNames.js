export const TEAM_NAMES = {
  ru: [
    // Хоккейные
    'Молния', 'Буря', 'Льды', 'Шайба', 'Коньки', 'Клюшка', 'Ворота', 'Лед', 'Шайбы', 'Хоккей',
    // Животные
    'Медведи', 'Орлы', 'Волки', 'Львы', 'Тигры', 'Ястребы', 'Барсы', 'Рыси', 'Соколы', 'Быки',
    // Общие спортивные
    'Чемпионы', 'Победители', 'Сила', 'Воля', 'Дух', 'Виктория', 'Триумф', 'Герои', 'Легенды', 'Воины',
    // Дополнительные
    'Буревестники', 'Стрела', 'Клинок', 'Щит', 'Меч', 'Копье', 'Броня', 'Шлем', 'Факел', 'Звезда'
  ],
  lv: [
    // Хоккейные
    'Zibens', 'Vētra', 'Ledus', 'Rieksts', 'Slidas', 'Nūja', 'Vārti', 'Ledus', 'Rieksti', 'Hokejs',
    // Животные
    'Lāči', 'Ērgļi', 'Vilki', 'Lauvas', 'Tīģeri', 'Vanagi', 'Leopardi', 'Lūši', 'Vērpi', 'Vērši',
    // Общие спортивные
    'Čempioni', 'Uzvarētāji', 'Spēks', 'Griba', 'Gars', 'Uzvara', 'Triumfs', 'Varoņi', 'Leģendas', 'Karavīri',
    // Дополнительные
    'Vētrasputni', 'Bulta', 'Asmens', 'Vairogs', 'Zobens', 'Šķēps', 'Bruņas', 'Ķivere', 'Lāpa', 'Zvaigzne'
  ]
}

/**
 * Получает набор названий команд для указанного языка
 * @param {string} language - Язык ('ru' или 'lv')
 * @returns {Array<string>} Массив названий команд
 */
export function getTeamNames(language = 'ru') {
  return TEAM_NAMES[language] || TEAM_NAMES.ru
}

