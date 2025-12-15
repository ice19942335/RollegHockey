import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import NavItem from './NavItem'
import { menuItems } from '../config/menuItems'
import CreateTournamentModal from './CreateTournamentModal'

function Navigation() {
  const navigate = useNavigate()
  const { t, language, changeLanguage } = useLanguage()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isVertical, setIsVertical] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isCreateTournamentModalOpen, setIsCreateTournamentModalOpen] = useState(false)
  const dropdownRef = useRef(null)
  const containerRef = useRef(null)

  const menuHandlers = {
    createTournament: () => setIsCreateTournamentModalOpen(true),
    tournamentsList: () => navigate('/'),
    playoffsList: () => {
      alert(t('functionInDevelopment'))
    },
    clearDatabase: () => {
      alert(t('functionInDevelopment'))
    }
  }

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
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Add/remove class to body when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-open')
    } else {
      document.body.classList.remove('mobile-menu-open')
    }
    
    return () => {
      document.body.classList.remove('mobile-menu-open')
    }
  }, [isMobile, isMobileMenuOpen])

  useEffect(() => {
    const checkWrap = () => {
      if (!containerRef.current) return
      
      const container = containerRef.current
      const wrapper = container.querySelector('.nav-items-wrapper')
      if (!wrapper) return
      
      const items = wrapper.querySelectorAll('.nav-item')
      if (items.length === 0) return
      
      // Check if items are wrapping (only for desktop)
      if (window.innerWidth > 768) {
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
        className={`navigation-container ${isVertical ? 'navigation-vertical' : ''} ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}
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
        {isMobile && (
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        )}
        <div className={`nav-items-wrapper ${isVertical ? 'nav-items-vertical' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {menuItems.map(item => (
            <NavItem
              key={item.id}
              onClick={(e) => {
                menuHandlers[item.id](e)
                if (isMobile) {
                  setIsMobileMenuOpen(false)
                }
              }}
              isDanger={item.isDanger}
            >
              {t(item.translationKey)}
            </NavItem>
          ))}
        </div>
      </div>
      <CreateTournamentModal 
        isOpen={isCreateTournamentModalOpen} 
        onClose={() => setIsCreateTournamentModalOpen(false)} 
      />
    </nav>
  )
}

export default Navigation

