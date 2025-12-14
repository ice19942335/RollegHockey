import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function Navigation({ onCreateTournament, onTournamentsList, onPlayoffsList, onClearDatabase }) {
  const { t, language, changeLanguage } = useLanguage()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isVertical, setIsVertical] = useState(false)
  const dropdownRef = useRef(null)
  const containerRef = useRef(null)

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

  useEffect(() => {
    const checkWrap = () => {
      if (!containerRef.current) return
      
      const container = containerRef.current
      const wrapper = container.querySelector('.nav-items-wrapper')
      if (!wrapper) return
      
      const items = wrapper.querySelectorAll('.nav-item')
      if (items.length === 0) return
      
      // Check if items are wrapping
      const firstItemTop = items[0].offsetTop
      let isWrapping = false
      
      for (let i = 1; i < items.length; i++) {
        if (items[i].offsetTop > firstItemTop) {
          isWrapping = true
          break
        }
      }
      
      setIsVertical(isWrapping)
    }

    checkWrap()
    window.addEventListener('resize', checkWrap)
    
    // Use ResizeObserver for more accurate detection
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(checkWrap)
      resizeObserver.observe(containerRef.current)
      
      return () => {
        window.removeEventListener('resize', checkWrap)
        resizeObserver.disconnect()
      }
    }
    
    return () => {
      window.removeEventListener('resize', checkWrap)
    }
  }, [])

  const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'lv', name: 'Latviešu', flag: '🇱🇻' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  return (
    <nav className="navigation">
      <div 
        ref={containerRef}
        className={`navigation-container ${isVertical ? 'navigation-vertical' : ''}`}
      >
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
        <div className={`nav-items-wrapper ${isVertical ? 'nav-items-vertical' : ''}`}>
          <button 
            className="nav-item"
            onClick={onCreateTournament}
          >
            {t('menuCreateTournament')}
          </button>
          <button 
            className="nav-item"
            onClick={onTournamentsList}
          >
            {t('menuTournamentsList')}
          </button>
          <button 
            className="nav-item"
            onClick={onPlayoffsList}
          >
            {t('menuPlayoffsList')}
          </button>
          <button 
            className="nav-item nav-item-danger"
            onClick={onClearDatabase}
          >
            {t('menuClearDatabase')}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navigation

