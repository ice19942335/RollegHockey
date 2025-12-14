import { useLanguage } from '../i18n/LanguageContext'

function Header() {
  const { t } = useLanguage()

  return (
    <header className="header">
      <div className="company-name">ROLLEG</div>
      <h1>{t('headerTitle')}</h1>
      <p>{t('headerSubtitle')}</p>
    </header>
  )
}

export default Header

