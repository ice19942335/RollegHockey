import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function Header() {
  const { language, changeLanguage, t } = useLanguage()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'lv', name: 'Latviešu', flag: '🇱🇻' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  return (
    <header className="header">
      <div className="header-top">
        <div className="language-selector" ref={dropdownRef}>
          <button
            className="language-selector-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Выбрать язык"
          >
            <span className="language-flag">{currentLanguage.flag}</span>
            <span className="language-arrow">▼</span>
          </button>
          {isDropdownOpen && (
            <div className="language-dropdown">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  className={`language-option ${language === lang.code ? 'active' : ''}`}
                  onClick={() => {
                    changeLanguage(lang.code)
                    setIsDropdownOpen(false)
                  }}
                  title={lang.name}
                  aria-label={lang.name}
                >
                  <span className="language-flag">{lang.flag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="company-name">ROLLEG</div>
      <h1>{t('headerTitle')}</h1>
      <p>{t('headerSubtitle')}</p>
    </header>
  )
}

export default Header

