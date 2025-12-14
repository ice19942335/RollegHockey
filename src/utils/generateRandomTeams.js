import { DEFAULT_TEAM_LOGOS, TEAM_COLORS } from '../constants/teamDefaults'
import { getTeamNames } from '../constants/teamNames'

/**
 * Генерирует случайные команды
 * @param {number} count - Количество команд для генерации
 * @param {string} language - Язык для выбора названий ('ru' или 'lv')
 * @param {Array} existingTeams - Массив существующих команд для проверки дубликатов
 * @returns {Array<Object>} Массив сгенерированных команд { id, name, logo, color }
 */
export function generateRandomTeams(count, language = 'ru', existingTeams = []) {
  if (!count || count < 1) {
    return []
  }

  // Получаем набор названий для языка
  const availableNames = getTeamNames(language)
  
  // Получаем названия существующих команд для проверки дубликатов
  const existingNames = existingTeams.map(team => team.name.toLowerCase().trim())
  
  // Фильтруем доступные названия, исключая уже использованные
  const unusedNames = availableNames.filter(name => 
    !existingNames.includes(name.toLowerCase().trim())
  )
  
  // Если доступных названий меньше, чем нужно, используем все доступные
  const namesToUse = unusedNames.length >= count 
    ? shuffleArray([...unusedNames]).slice(0, count)
    : shuffleArray([...unusedNames])
  
  // Если все названия использованы, добавляем суффиксы
  const generatedTeams = []
  const usedNamesInBatch = new Set()
  
  for (let i = 0; i < count; i++) {
    let teamName
    
    if (i < namesToUse.length) {
      teamName = namesToUse[i]
    } else {
      // Если названия закончились, используем базовое название с номером
      const baseName = unusedNames.length > 0 
        ? unusedNames[0] 
        : availableNames[0]
      let counter = 1
      do {
        teamName = `${baseName} ${counter}`
        counter++
      } while (existingNames.includes(teamName.toLowerCase().trim()) || usedNamesInBatch.has(teamName.toLowerCase().trim()))
    }
    
    usedNamesInBatch.add(teamName.toLowerCase().trim())
    
    // Случайный эмодзи
    const randomLogo = DEFAULT_TEAM_LOGOS[Math.floor(Math.random() * DEFAULT_TEAM_LOGOS.length)]
    
    // Случайный цвет
    const randomColor = TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)]
    
    // Генерируем уникальный ID
    const teamId = `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`
    
    generatedTeams.push({
      id: teamId,
      name: teamName,
      logo: randomLogo.emoji,
      color: randomColor.value
    })
  }
  
  return generatedTeams
}

/**
 * Перемешивает массив случайным образом (алгоритм Фишера-Йетса)
 * @param {Array} array - Массив для перемешивания
 * @returns {Array} Перемешанный массив
 */
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

