import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Загружаем сохраненный язык из localStorage или используем латышский по умолчанию
    const savedLanguage = localStorage.getItem('appLanguage')
    return savedLanguage && translations[savedLanguage] ? savedLanguage : 'lv'
  })

  useEffect(() => {
    // Сохраняем выбранный язык в localStorage
    localStorage.setItem('appLanguage', language)
  }, [language])

  const t = (key, params = {}) => {
    const translation = translations[language]?.[key] || translations.lv[key] || translations.ru[key] || key
    
    // Заменяем параметры в строке
    if (params && Object.keys(params).length > 0) {
      return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match
      })
    }
    
    return translation
  }

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

