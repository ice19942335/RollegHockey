import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { useAdmin } from '../contexts/AdminContext'

function Header() {
  const { t } = useLanguage()
  const { enableAdmin } = useAdmin()
  const [clickCount, setClickCount] = useState(0)
  const clickTimeoutRef = useRef(null)

  useEffect(() => {
    // Очищаем таймер при размонтировании
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  const handleCompanyNameClick = () => {
    // Очищаем предыдущий таймер
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
    }

    // Увеличиваем счетчик
    const newCount = clickCount + 1
    setClickCount(newCount)

    // Если достигли 5 кликов, активируем администратора
    if (newCount >= 5) {
      enableAdmin()
      setClickCount(0)
    } else {
      // Сбрасываем счетчик через 2 секунды бездействия
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0)
      }, 2000)
    }
  }

  return (
    <header className="header">
      <div 
        className="company-name" 
        onClick={handleCompanyNameClick}
        style={{ userSelect: 'none' }}
        title=""
      >
        ROLLEG
      </div>
      <h1>{t('headerTitle')}</h1>
      <p>{t('headerSubtitle')}</p>
    </header>
  )
}

export default Header

